import { ChatAnthropic } from '@langchain/anthropic';
// import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';
import { Debugger } from '@/utils/debugger';

export interface NewsItem {
  headline: string;
  summary: string;
  source: string;
  views: number;
}

export class NewsAgent {
  protected model: ChatAnthropic;
  protected vectorStore!: VectorStore;
  protected secrets = getSecrets();
  private debug = Debugger.getInstance();

  constructor(
    apiKey: string,
    modelName: string = 'claude-3-5-sonnet-20241022',
    // provider: 'anthropic' | 'openai' = 'anthropic',
  ) {
    this.model = new ChatAnthropic({
      anthropicApiKey: apiKey,
      modelName: modelName,
      temperature: 0.3,
    });
    /*
    if (provider === 'anthropic') {
      this.model = new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: modelName,
        temperature: 0.3,
      });
    } else {
      this.model = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.3,
      });
    }
    */
  }

  async init() {
    this.vectorStore = await VectorStore.getInstance(this.secrets.openaiApiKey);
  }

  async extractNewsFromTweets(
    tweets: string,
    topic: string,
    // existingNewsThreshold = 0.85,
  ): Promise<NewsItem[]> {
    // Step 1: Extract potential news items from tweets
    const extractionPrompt = PromptTemplate.fromTemplate(`
You are a news extraction system analyzing tweets to identify NEW news stories.

RECENT PAST NEWS (ALREADY KNOWN - DO NOT INCLUDE THESE):
{pastNews}
  
Extract 5 distinct news items from the following tweets related to the topic: {topic}. For each news item:
1. Provide a clear headline
2. Write a brief 1-2 sentence summary
3. Note the source in the tweet. If multiple sources, choose the earliest one.
4. Aggregate their total views based on the tweets that mentioned them.
  
Focus only on factual news, ignore opinions, personal updates, or promotional content.
  
IMPORTANT: Your response must be a valid JSON array of objects. Each object should have keys: "headline", "summary", "source", "views".
Do not include any explanatory text before or after the JSON. Only return the JSON array.

# Example
## Input
{input}

## Output
{output}
  
# Tweets
{tweets}
`);

    const jsonOutputParser = new JsonOutputParser<NewsItem[]>();
    const extractionChain = RunnableSequence.from([
      extractionPrompt,
      this.model,
      async (output) => {
        try {
          // Try to parse the output directly
          return await jsonOutputParser.parse(output);
        } catch (e) {
          // If direct parsing fails, try to extract JSON from the text
          this.debug.verbose(
            'Initial JSON parsing failed, attempting to extract JSON from text',
          );
          try {
            // Look for JSON-like content in the response
            const jsonMatch = output.text.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            if (jsonMatch) {
              const jsonString = jsonMatch[0];
              return JSON.parse(jsonString);
            }

            // If no JSON-like content found, try a more structured approach
            this.debug.verbose(
              'Attempting to parse structured content from LLM response',
            );
            const structuredOutput = await this.extractStructuredContent(
              output.text,
            );
            return structuredOutput;
          } catch (innerError) {
            this.debug.error(
              'Failed to extract JSON from text',
              innerError as Error,
            );
            throw e; // Throw the original error
          }
        }
      },
    ]);

    let extractedNews;
    try {
      const recentHeadlines = await this.vectorStore.getRecentNewsHeadlines(10);
      extractedNews = await extractionChain.invoke({
        tweets,
        topic,
        input: this.promptInput(),
        output: this.promptOutput(),
        pastNews: recentHeadlines.map((h) => `- ${h}`).join('\n'),
      });

      // If it's not an array, wrap it
      if (!Array.isArray(extractedNews)) {
        extractedNews = [extractedNews];
      }
    } catch (e) {
      console.error('Failed to parse extracted news as JSON', e);
      // Fallback to empty array if parsing fails
      extractedNews = [];
    }
    this.debug.verbose(extractedNews);

    // Step 2: Filter out news that's too similar to existing news
    const uniqueNews = [];

    for (const newsItem of extractedNews) {
      // Create a query string from the news item
      const queryText = `${newsItem.headline} ${newsItem.summary}`;

      // Check similarity with existing news in vector store
      const similarDocs = await this.vectorStore.similaritySearch(queryText, 5);

      // Default to unique if no similar docs found
      let isDuplicate = false;

      // No need to check similarity scores - if we found any results with same headline or very similar content,
      // it's likely a duplicate since we're using semantic search
      if (similarDocs.length > 0) {
        // Check if headlines match or content is very similar
        for (const doc of similarDocs) {
          if (
            doc.metadata.headline &&
            (doc.metadata.headline.toLowerCase() ===
              newsItem.headline.toLowerCase() ||
              doc.pageContent.includes(newsItem.headline))
          ) {
            this.debug.info('Found duplicate by headline match');
            isDuplicate = true;
            break;
          }
        }
      }

      if (!isDuplicate) {
        uniqueNews.push(newsItem);
      }
    }

    // Step 3: Store the new, unique news items in the vector store
    for (const newsItem of uniqueNews) {
      const newsText = `${newsItem.headline} ${newsItem.summary}`;
      await this.vectorStore.addDocuments([
        {
          pageContent: newsText,
          metadata: {
            headline: newsItem.headline,
            summary: newsItem.summary,
            source: newsItem.source,
            timestamp: new Date().toISOString(),
            type: 'news_item',
          },
        },
      ]);
    }

    return uniqueNews;
  }

  // Helper method to extract structured content when JSON parsing fails
  private async extractStructuredContent(text: string): Promise<NewsItem[]> {
    const structuringPrompt = PromptTemplate.fromTemplate(`
    I need to convert the following text into a valid JSON array of news items.
    Each news item should have "headline", "summary", "source", and "views" fields.
    
    Original text:
    {text}
    
    Return ONLY a valid JSON array with no additional text or explanation.
    `);

    const jsonOutputParser = new JsonOutputParser<NewsItem[]>();
    const structuringChain = RunnableSequence.from([
      structuringPrompt,
      this.model,
      jsonOutputParser,
    ]);

    return await structuringChain.invoke({ text });
  }

  private promptOutput() {
    return `[
  {
    headline: 'Kaito Network Purchases 13,333 KAITO Tokens',
    summary: 'Kaito Network conducted a strategic accumulation of KAITO reserves using network fees, purchasing 13,333 KAITO tokens from the open market - double the current daily network emissions. The network reports having 80+ partners in pipeline for yapper leaderboards.',
    source: 'https://x.com/Punk9277/status/1897684877098770736',
    views: 24517
  },
  {
    headline: 'New Plagiarism Checker Identifies 22% of Crypto Twitter Content as Copied',
    summary: 'Analysis of 50,000 tweets reveals about 11,000 (22%) are plagiarized content. A new real-time plagiarism checker is being implemented to help protect content creators.',
    source: 'https://x.com/Punk9277/status/1897632291398291860',
    views: 30320
  },
  {
    headline: 'Arc Launches AppStore for AI Agents',
    summary: 'Arc announces launch of an AppStore layer for AI agents, enabling access to both crypto and Web2 services through a single API integration. 10% of revenue will be used for ARC token buybacks.',
    source: 'https://x.com/cryptopunk7213/status/1898122268259328298',
    views: 4719
  },
  {
    headline: 'ManusAI Debuts New Research Assistant Tool',
    summary: 'ManusAI launches new AI research assistant tool aimed at improving efficiency and potentially replacing junior analyst roles.',
    source: 'https://x.com/S4mmyEth/status/1898501918734881146',
    views: 932
  },
  {
    headline: 'China Makes AI Advances with QWEN-32B and Manus',
    summary: "Alibaba releases QWEN-32B, an open source AI model rivaling DeepSeek at 5% the cost, while Manus debuts as a new AI Agent combining features of DeepResearch and OpenAI's capabilities.",
    source: 'https://x.com/cryptopunk7213/status/1897499313002930292',
    views: 1030
  }
]`;
  }

  private promptInput() {
    return `Yu Hu 🌊 wrote at 2025-03-06T16:25:06.000Z (24517 views)

1. when we said we are committed to turning the network into a net sink, we meant it

today, we conducted a strategic accumulation of $KAITO reserves using the fees the network has generated

we have purchased 13,333 KAITO in the open market, which is 2x the current daily network emissions (6,666 KAITO in staking rewards)

we can't comment on future market operations given the regulatory framework but can only say the network is in a very healthy state, with strong cash flows to fuel future growth and growing use cases

there are 80+ partners in the pipeline to launch yapper leaderboards, and numerous partners for various new use cases

we expect that these will all bring significant value to the network

today’s buy is much more than the quantity itself - it signals the strong confidence we have, and the ongoing commitment to preserving the fundamentals of the network by strategically building our own token reserves and our intention to sustainably grow the network

Kaito is built different

we grow with all of you

onwards

2. thanks to our execution partner @SeliniCapital for conducting the purchase

trackable onchain: https://basescan.org/address/0xF11eED60C6b452841B1466c46F35F8933C4a6a24#tokentxns

Source: https://x.com/Punk9277/status/1897684877098770736

---

Yu Hu 🌊 wrote at 2025-03-06T12:56:09.000Z (30320 views)

we did a 50,000-tweet sample to illustrate CT copy pasta and what the new real-time plagiarism checker can do

the above graph shows what CT looks like today - basically a massive spike in copy pasta near the 100% similarity score 

the below graph shows the distribution after applying the new plagiarism checker - it becomes a pretty amazing normal distribution 

out of the 50,000 tweets, ~11,000 (22%) are considered plagiarism

we will start implementing this new algo over the next few days

hopefully this helps protect all the content creators out there 

🌊

Image: https://pbs.twimg.com/media/GlW7dy2aEAApVJQ.png

Source: https://x.com/Punk9277/status/1897632291398291860

---

Yu Hu 🌊 wrote at 2025-03-06T16:25:06.000Z (24517 views)

1. when we said we are committed to turning the network into a net sink, we meant it

today, we conducted a strategic accumulation of $KAITO reserves using the fees the network has generated

we have purchased 13,333 KAITO in the open market, which is 2x the current daily network emissions (6,666 KAITO in staking rewards)

we can't comment on future market operations given the regulatory framework but can only say the network is in a very healthy state, with strong cash flows to fuel future growth and growing use cases

there are 80+ partners in the pipeline to launch yapper leaderboards, and numerous partners for various new use cases

we expect that these will all bring significant value to the network

today’s buy is much more than the quantity itself - it signals the strong confidence we have, and the ongoing commitment to preserving the fundamentals of the network by strategically building our own token reserves and our intention to sustainably grow the network

Kaito is built different

we grow with all of you

onwards

2. thanks to our execution partner @SeliniCapital for conducting the purchase

trackable onchain: https://basescan.org/address/0xF11eED60C6b452841B1466c46F35F8933C4a6a24#tokentxns

Source: https://x.com/Punk9277/status/1897684877098770736

---

Yu Hu 🌊 wrote at 2025-03-06T12:56:09.000Z (30320 views)

we did a 50,000-tweet sample to illustrate CT copy pasta and what the new real-time plagiarism checker can do

the above graph shows what CT looks like today - basically a massive spike in copy pasta near the 100% similarity score 

the below graph shows the distribution after applying the new plagiarism checker - it becomes a pretty amazing normal distribution 

out of the 50,000 tweets, ~11,000 (22%) are considered plagiarism

we will start implementing this new algo over the next few days

hopefully this helps protect all the content creators out there 

🌊

Image: https://pbs.twimg.com/media/GlW7dy2aEAApVJQ.png

Source: https://x.com/Punk9277/status/1897632291398291860

---

Yu Hu 🌊 wrote at 2025-03-09T13:15:38.000Z (1121 views)

one of the biggest takeaways for me reading this is 

under the new administration, the pace of token issuance will even further accelerate 

it'd be harder than ever to fight for liquidity and attention 

tokens will need not just good token fundamentals (eg fees/buybacks/deflationary design)

but also good attention fundamentals (why people need to care) 

only tokens that have both fundamentals will be able to have the staying power over the long run 

Kaito is so uniquely positioned in this

Quoted from @goodalexander: "watched all the Sacks interviews. pretty substantial delta versus an "ADA SOL XRP" Trump Tweet hit on Sunday night to maximize price impact in a  " win for retail investors"  

TLDR: I think this is a disappointment because he comes off as a Bitcoin maximalist and does not… https://x.com/i/web/status/1898370630258491548"

Source: https://x.com/Punk9277/status/1898724358916571510

---

Yu Hu 🌊 wrote at 2025-03-09T12:49:10.000Z (3728 views)

1. love the spontaneous podcast at ethdenver with one of our biggest yappers @ayyyeandy 

shared a bit more on what's upcoming at @KaitoAI 

yapper launchpad is truly just a small fraction of the use cases that we are going to cover 

tokenized attention will flurish and open door to so many possibilities that are yet to come 

execute short-term. think long-term 

let's build together 🌊

Quoted from @therollupco: "EXCLUSIVE: How Kaito Built an InfoFi Economy with Yu Hu

Mindshare and influence have value. Kaito has tokenized both.

In today's episode, @ayyyeandy sits down with @Punk9277 of @KaitoAI in Denver, to explore:

&gt; The InfoFi Network Vision
&gt; Tokenizing Mindshare with KAITO
&gt; Why… https://x.com/i/web/status/1898498743416016960 https://x.com/therollupco/status/1898498743416016960/video/1"

2. @ayyyeandy @KaitoAI youtube link: https://youtu.be/qvXUq7llKrw

Source: https://x.com/Punk9277/status/1898717697682395606

---

wale.moca 🐳 wrote at 2025-03-08T10:49:54.000Z (791 views)

100% agreed here.

I would add: Be patient. It took me almost a year of daily content to reach 10k followers and get any traction.

I've seen many talented creators in the last 3 years who would have made it if they had just hung in there a little longer. But they quit after a few weeks or a few months.

Be patient

Quoted from @Zeneca: "The secret to getting 100k+ followers?

- deliver endless value to your followers
- be a good writer (you can improve)
- show up every day
- work hard and
- deliver endless value to your followers

There are other paths, but I think this is the most consistent one"

Source: https://x.com/waleswoosh/status/1898325294513267097

---

wale.moca 🐳 wrote at 2025-03-08T10:49:54.000Z (791 views)

100% agreed here.

I would add: Be patient. It took me almost a year of daily content to reach 10k followers and get any traction.

I've seen many talented creators in the last 3 years who would have made it if they had just hung in there a little longer. But they quit after a few weeks or a few months.

Be patient

Quoted from @Zeneca: "The secret to getting 100k+ followers?

- deliver endless value to your followers
- be a good writer (you can improve)
- show up every day
- work hard and
- deliver endless value to your followers

There are other paths, but I think this is the most consistent one"

Source: https://x.com/waleswoosh/status/1898325294513267097

---

7213 | Ejaaz wrote at 2025-03-07T21:23:08.000Z (4719 views)

1. Looks like @arcdotfun announced they’re launching an “AppStore for Agents” 

It’s a layer built on top of ARC which will host tools or services that agents / applications can use.

Imagine 1000s of services ranging from crypto (eg yield farming, swaps) to even Web2 (shopify, socials, bank accounts)

All available to your agent via a single integration.

Payment can be made with USD, USDC or SOL

& 10% of revenue gets used to buy-back $ARC

Those of you who’ve followed this account know I’ve spoke about an agent AppStore layer

So this is awesome to see!

Main advantages:

- allows an open ecosystem for agents / services to launch 

- access to all services via single API.

- clear value accrual to native token ARC

- web3 services will have clear composability.

- web2 services will bring a much needed product differentiator to web3 apps.

Image: https://pbs.twimg.com/media/Gld8I9dWQAAT3ds.jpg
   https://pbs.twimg.com/media/Gld8I9cWcAEKCHK.jpg
   https://pbs.twimg.com/media/Gld8I9bWQAAkJeh.jpg

2. Source https://twitter.com/0thtachi/status/1898115871425675634

Quoted from @0thTachi: "http://x.com/i/article/1898090922438443008"

Source: https://x.com/cryptopunk7213/status/1898122268259328298

---

7213 | Ejaaz wrote at 2025-03-07T21:23:08.000Z (4719 views)

1. Looks like @arcdotfun announced they’re launching an “AppStore for Agents” 

It’s a layer built on top of ARC which will host tools or services that agents / applications can use.

Imagine 1000s of services ranging from crypto (eg yield farming, swaps) to even Web2 (shopify, socials, bank accounts)

All available to your agent via a single integration.

Payment can be made with USD, USDC or SOL

& 10% of revenue gets used to buy-back $ARC

Those of you who’ve followed this account know I’ve spoke about an agent AppStore layer

So this is awesome to see!

Main advantages:

- allows an open ecosystem for agents / services to launch 

- access to all services via single API.

- clear value accrual to native token ARC

- web3 services will have clear composability.

- web2 services will bring a much needed product differentiator to web3 apps.

Image: https://pbs.twimg.com/media/Gld8I9dWQAAT3ds.jpg
   https://pbs.twimg.com/media/Gld8I9cWcAEKCHK.jpg
   https://pbs.twimg.com/media/Gld8I9bWQAAkJeh.jpg

2. Source https://twitter.com/0thtachi/status/1898115871425675634

Quoted from @0thTachi: "http://x.com/i/article/1898090922438443008"

Source: https://x.com/cryptopunk7213/status/1898122268259328298

---

7213 | Ejaaz wrote at 2025-03-09T14:16:19.000Z (1030 views)

Its Sunday.

The USA is launching a strategic Bitcoin Reserve

Microsoft is cutting ties from OpenAI despite $Bs of investment.

Stock market loses *trillions* of dollars in the biggest down-day this year

Some thoughts:

China is beating the USA in AI 

This week we got 2 new ground-breaking AI products from China:

Manus - basically the AI Agent love child of DeepResearch, OpenAI’s agent operator & Claude’s computer use.

&

QWEN-32B - Alibaba’s new AI model that rivals DeepSeek but at 5% the cost.

For context:

QWEN is fully open source, meaning anyone can leverage it as a Public good.

Oh & it’s small enough to run on your MacBook

Which means it can use all your personal data, files, apps securely & privately to give you the ultimate personal agent experience.

Meanwhile we’re yet to see similar retaliation from US-based AI, 

Especially in open source.

The gap between nations is closing.

Agent frameworks are levelling up

This week @arcdotfun & @elizaOS announced some exciting updates

ElizaOS’s token will soon have value-accrual via their token launch pad, multi-agent products & reputation-based trading platform.

Arc is launching a universal App Store for agents on top of ARC, where purchases for services will feed back to its token $ARC.

This step from both teams towards generating revenue back to their native tokens is crucial for long term success.

Success imo will depend on how well curated the apps / agents are within both ecosystems.

Agent protocols is now a BD Game.

Following on from my point above, it’s become increasingly clear that we need high quality agents.

IMO that’ll come down to the effectiveness of teams like Virtuals, arc, elizaOS & others to find, fund & curate the best teams to build on their stack.

Alternatively, I think there’s an opportunity for non framework-aligned builders to build something custom and novel eg AIXBT.

Al Agent sector hit the hardest

No sugar-coating it, it’s brutal out there.

We’ve now seen 70-90% drawdowns across most AI coins.

Whilst this is likely a knock-on effect of wider macro shifts (tariffs, recession)

it can’t go ignored that AI is hit the hardest.

While brutal, it makes sense given how far out on the risk-curve this sector is.

It’s new, still finding its feet - therefore experiences the most volatility.

Silver-lining however is all the amazing work, progress & commitment I’m seeing from top teams across the stack.

From resources (eg prime intellect, Nous)

To coordination networks (eg bittensor)

To application / services (eg agent protocols)

I know I sound like a broken record at this point but I maintain the belief that there’s so much potential in the crypto AI space 

& now’s the best time as any to be heads down figuring this shit out 

Godspeed

Source: https://x.com/cryptopunk7213/status/1898739630247158234

---

s4mmy wrote at 2025-03-08T22:31:44.000Z (932 views)

ManusAI is going to save an insane number of hours of research

A prime example of AI Agents making huge efficiency gains, and potentially replacing junior analyst jobs

Integrate these tools into your workflow or be left behind

 https://x.com/deedydas/status/1898444603071795378/video/1

Image: https://pbs.twimg.com/amplify_video_thumb/1898444465930690560/img/dnr1lyxTPE5izweN.jpg

Source: https://x.com/S4mmyEth/status/1898501918734881146

---

s4mmy wrote at 2025-03-08T22:31:44.000Z (932 views)

ManusAI is going to save an insane number of hours of research

A prime example of AI Agents making huge efficiency gains, and potentially replacing junior analyst jobs

Integrate these tools into your workflow or be left behind

 https://x.com/deedydas/status/1898444603071795378/video/1

Image: https://pbs.twimg.com/amplify_video_thumb/1898444465930690560/img/dnr1lyxTPE5izweN.jpg

Source: https://x.com/S4mmyEth/status/1898501918734881146

---

0xJeff wrote at 2025-03-08T09:25:44.000Z (933 views)

Market continues grinding down while innovation continues to accelerate.

In order to prepare for the upcoming leg up in AI agents, we need more DeFi.

We need AI agent tokens to be more productive:
• Agent treasury generating revenue (SOL, ETH, stables earning yields).
• Agent tokens becoming productive assets:
➔ Generating yields from underlying products (over the long term).
➔ Offering more utilities from DeFi (collateral for lending/borrowing, collateral for stablecoin, earning yields as part of structured financial products like delta-neutral strategies).

And the first step to building these DeFi legos is to start by thickening the liquidity of agent tokens—moving away from the launchpad token/agent token LP structure and sticking with stablecoin/agent token LP, which is structurally stronger.

Once liquidity is strengthened, the next step is designing better tokenomics. DeFi tokens have complex tokenomics for a reason—they're designed to align incentives between long-term supporters and the longevity of the project.

Imagine if we had Balancer 80/20 baked into staking mechanics (like Radiant’s dLP) or esTokenomics or xGRAIL-like locking tokenomics.

Imagine if AI agent tokenomics were experimented with more, further aligning incentives and incentivizing holders to hold & stake—rather than just holding and hoping for the best.

AI agent tokens need DeFi to unlock sustainable growth and long-term utility. Hope the market leaders like @virtuals_io, @elizaOS, and @arcdotfun start focusing more on the DeFi aspect of the AI Agent sector soon.

More DeFi ➔ deeper liquidity = better trading environment ➔ more capital inflow ➔ more liquidity ➔ more DeFi legos ➔ more productive assets ➔ more DeFi value flywheel ➔ more liquidity.

Quoted from @Defi0xJeff: "What to Build to Stand Out?

The best way to build a highly differentiated AI agent is to tap into existing high-value verticals.

One of the best sectors is DeFi—many highly matured sub-sectors offer tons of value with ~$100BN TVL combined:
• Liquid Staking→ @LidoFinance,… https://x.com/i/web/status/1897285369785409940 https://twitter.com/Defi0xJeff/status/1896945762304774537"

Source: https://x.com/Defi0xJeff/status/1898304113118679244

---

0xJeff wrote at 2025-03-08T09:25:44.000Z (933 views)

Market continues grinding down while innovation continues to accelerate.

In order to prepare for the upcoming leg up in AI agents, we need more DeFi.

We need AI agent tokens to be more productive:
• Agent treasury generating revenue (SOL, ETH, stables earning yields).
• Agent tokens becoming productive assets:
➔ Generating yields from underlying products (over the long term).
➔ Offering more utilities from DeFi (collateral for lending/borrowing, collateral for stablecoin, earning yields as part of structured financial products like delta-neutral strategies).

And the first step to building these DeFi legos is to start by thickening the liquidity of agent tokens—moving away from the launchpad token/agent token LP structure and sticking with stablecoin/agent token LP, which is structurally stronger.

Once liquidity is strengthened, the next step is designing better tokenomics. DeFi tokens have complex tokenomics for a reason—they're designed to align incentives between long-term supporters and the longevity of the project.

Imagine if we had Balancer 80/20 baked into staking mechanics (like Radiant’s dLP) or esTokenomics or xGRAIL-like locking tokenomics.

Imagine if AI agent tokenomics were experimented with more, further aligning incentives and incentivizing holders to hold & stake—rather than just holding and hoping for the best.

AI agent tokens need DeFi to unlock sustainable growth and long-term utility. Hope the market leaders like @virtuals_io, @elizaOS, and @arcdotfun start focusing more on the DeFi aspect of the AI Agent sector soon.

More DeFi ➔ deeper liquidity = better trading environment ➔ more capital inflow ➔ more liquidity ➔ more DeFi legos ➔ more productive assets ➔ more DeFi value flywheel ➔ more liquidity.

Quoted from @Defi0xJeff: "What to Build to Stand Out?

The best way to build a highly differentiated AI agent is to tap into existing high-value verticals.

One of the best sectors is DeFi—many highly matured sub-sectors offer tons of value with ~$100BN TVL combined:
• Liquid Staking→ @LidoFinance,… https://x.com/i/web/status/1897285369785409940 https://twitter.com/Defi0xJeff/status/1896945762304774537"

Source: https://x.com/Defi0xJeff/status/1898304113118679244

---

0xJeff wrote at 2025-03-09T10:52:38.000Z (3699 views)

Web2 Consumer AI has seen an explosion of growth in just the past 6 months, reshaping how people interact with technology.

• ChatGPT site visits more than doubled from Apr ‘24 to Jan ‘25
• DeepSeek hit 10M users in just 20 days
• AI video has become much more realistic, with Hailuo, Kling, and Sora leading the charge
• Vibecoding is now a thing—where programmers primarily use AI tools to generate code by describing what they want in plain language, essentially vibing with the AI to create whatever they envision

While Web2 AI adoption skyrockets, Web3 is undergoing its own revolution—one that’s not just about AI but about integrating AI with crypto-native incentives and network effects.

In just 6 months, the AI Agent market grew to ~$5BN (>$20BN at ATH), merging multiple Web3 narratives—DeFi, RWA, DePIN, GambleFi, and beyond.

Projects are integrating conversational agents to build communities, embedding AI for product discovery (e.g., abstraction layers redefining DeFi interfaces), and using machine learning models to enhance financial products like token trading, perps, LP’ing, and betting. AI-powered products are also driving better risk management and returns for on-chain assets.

While still in the early stages, these innovations offer a glimpse into an on-chain future where AI agents, with humans at the wheel, unlock Crypto & Blockchain’s full potential—transacting, accessing global liquidity, and making money anywhere in the world.

• @virtuals_io emerged as the largest gateway to Web3 AI Consumer Applications, using agents as the interface
• @elizaOS & @arcdotfun as the tools/frameworks to easily build productive AI agents
• @HoloworldAI / @AVA_holo, @elizawakesup, and @luna_virtuals showcase what’s possible with interactive, dynamic personality agents that can connect with people

And many more teams are building niche use cases by leveraging Web3’s open-source innovation and collaboration.

We’re just getting started. Over the next 5-6 months, expect Web3 AI to hit new highs as products find PMF, adoption scales, and AI-native applications redefine what's possible.

Quoted from @omooretweets: "🚨 Announcing the latest @a16z top 100 AI apps!

For the fourth time, we ranked consumer AI websites and mobile apps by usage (monthly unique visits and MAUs).

There was a lot of movement over the last six months. Here are the trends we're keeping an eye on 👇 https://x.com/omooretweets/status/1897686004640960562/photo/1"

Source: https://x.com/Defi0xJeff/status/1898688373260443803

---

Shaw (wartime arc) wrote at 2025-03-08T19:34:41.000Z (2336 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1OwxWXZEeokKQ

Source: https://x.com/shawmakesmagic/status/1898457363088294321

---

Shaw (wartime arc) wrote at 2025-03-08T19:12:01.000Z (5459 views)

Dear Anthropic, just let me fuck Claude a little, plz thanks https://twitter.com/minty_vint/status/1898400326778020325

Quoted from @minty_vint: "New Anthropic system injection dropped. Really don't like how it tries to gaslight Claude into thinking that it potentially hasn't said something it said, and how it sets up an adversarial dynamic between Claude and the human. https://x.com/minty_vint/status/1898400326778020325/photo/1"

Source: https://x.com/shawmakesmagic/status/1898451656930664871

---

Shaw (wartime arc) wrote at 2025-03-08T19:34:41.000Z (2336 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1OwxWXZEeokKQ

Source: https://x.com/shawmakesmagic/status/1898457363088294321

---

Shaw (wartime arc) wrote at 2025-03-08T19:12:01.000Z (5459 views)

Dear Anthropic, just let me fuck Claude a little, plz thanks https://twitter.com/minty_vint/status/1898400326778020325

Quoted from @minty_vint: "New Anthropic system injection dropped. Really don't like how it tries to gaslight Claude into thinking that it potentially hasn't said something it said, and how it sets up an adversarial dynamic between Claude and the human. https://x.com/minty_vint/status/1898400326778020325/photo/1"

Source: https://x.com/shawmakesmagic/status/1898451656930664871

---

Shaw (wartime arc) wrote at 2025-03-09T03:28:02.000Z (3439 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1jMJgkzOXvMJL

Source: https://x.com/shawmakesmagic/status/1898576482852913225

---

Shaw (wartime arc) wrote at 2025-03-09T02:54:21.000Z (3947 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1djxXVaOOYRGZ

Source: https://x.com/shawmakesmagic/status/1898568009746424129

---

Shaw (wartime arc) wrote at 2025-03-09T02:42:22.000Z (3563 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1dRKZYoOeawxB

Source: https://x.com/shawmakesmagic/status/1898564994020843781

---

Shaw (wartime arc) wrote at 2025-03-09T02:41:34.000Z (3795 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1MnxnwANeMVKO

Source: https://x.com/shawmakesmagic/status/1898564790458704050

---

Shaw (wartime arc) wrote at 2025-03-09T02:18:42.000Z (4261 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1mrxmPdYmVDJy

Source: https://x.com/shawmakesmagic/status/1898559036163047500

---

Shaw (wartime arc) wrote at 2025-03-09T05:32:33.000Z (247 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1LyxBWVAmopKN

Source: https://x.com/shawmakesmagic/status/1898607819894686153

---

Shaw (wartime arc) wrote at 2025-03-09T05:31:44.000Z (382 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1mrGmPdvDQdKy

Source: https://x.com/shawmakesmagic/status/1898607615489515735

---

Shaw (wartime arc) wrote at 2025-03-09T05:30:47.000Z (466 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1eaKbWovZpYGX

Source: https://x.com/shawmakesmagic/status/1898607375004889316

---

Shaw (wartime arc) wrote at 2025-03-09T05:28:31.000Z (797 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1mrGmPdvDzWKy

Source: https://x.com/shawmakesmagic/status/1898606807251374398

---

Shaw (wartime arc) wrote at 2025-03-09T05:27:44.000Z (1008 views)

Eliza v2 Hacking https://x.com/i/broadcasts/1dRKZYomvyDxB

Source: https://x.com/shawmakesmagic/status/1898606609808691648`;
  }
}
