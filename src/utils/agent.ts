import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import {
  StateGraph,
  MessagesAnnotation,
  Annotation,
} from '@langchain/langgraph';
import { tools } from '@/utils/tools';
import { prisma } from '@/lib/prisma';

export interface TokenData {
  name: string;
  symbol: string;
  marketCap: number;
  address: string;
  created: string;
  description?: string;
}

type Memory = Record<string, { marketCap: number; lastSeen: string }>;
type Decision = 'new_alert' | 'update_alert' | 'suppress_alert';

// Define a custom state annotation for the alert graph
const StateAnnotation = Annotation.Root({
  token: Annotation<any>(),
  decision: Annotation<string | undefined>(),
  previous: Annotation<any | undefined>(),
  content: Annotation<string | undefined>(),
  llmJustification: Annotation<string | undefined>(),
  recentAlerts: Annotation<any[] | undefined>(),
});

export class ChatAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private app: any;
  private conversationStates: Map<string, typeof MessagesAnnotation.State>;
  private memory: Memory = {};

  // Alert-specific StateGraph and conversation state
  private alertApp: any;

  constructor() {
    const toolNode = new ToolNode(tools);
    const model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0,
    }).bindTools(tools);

    // Define the function that determines whether to continue or not
    function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
      const lastMessage = messages[messages.length - 1] as AIMessage;

      // If the LLM makes a tool call, then we route to the "tools" node
      if (lastMessage.tool_calls?.length) {
        return 'tools';
      }
      // Otherwise, we stop (reply to the user) using the special "__end__" node
      return '__end__';
    }

    // Define the function that calls the model
    async function callModel(state: typeof MessagesAnnotation.State) {
      const response = await model.invoke(state.messages);

      // We return a list, because this will get added to the existing list
      return { messages: [response] };
    }

    // Define a new graph
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addEdge('__start__', 'agent') // __start__ is a special name for the entrypoint
      .addNode('tools', toolNode)
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue);

    this.app = workflow.compile();
    this.conversationStates = new Map();

    // --- Alert-specific StateGraph ---
    const alertGraph = new StateGraph(StateAnnotation)
      .addNode('decide', this.decisionNode.bind(this))
      .addNode('llm', this.chatNode.bind(this))
      .addEdge('__start__', 'decide')
      .addConditionalEdges('decide', (state: any) =>
        state.decision === 'suppress_alert' ? '__end__' : 'llm',
      )
      .addEdge('llm', '__end__');

    this.alertApp = alertGraph.compile();
  }

  async generateReply(request: string, threadId: string) {
    // Get previous state or create new conversation
    const prevState = this.conversationStates.get(threadId) || { messages: [] };

    // Use the agent
    const finalState = await this.app.invoke(
      {
        messages: [
          ...prevState.messages,
          new SystemMessage(
            "You are an AI assistant named Maix. Always be concise and direct in your responses. \
Avoid unnecessary explanations or verbosity. Give responses as plain text. \
Be hella casual. Write in lowercaps. Don't give response as Markdown",
          ),
          new HumanMessage(request),
        ],
      },
      { configurable: { thread_id: threadId } },
    );

    // Store the updated conversation state
    this.conversationStates.set(threadId, finalState);

    return finalState.messages[finalState.messages.length - 1].content;
  }

  public async generateAlert(token: TokenData): Promise<string | null> {
    // const threadId = 'alert-global';
    // const prevState = this.conversationStates.get(threadId) || { messages: [] };
    const result = await this.alertApp.invoke({
      token,
      decision: undefined,
      previous: undefined,
      content: undefined,
    });

    // Update memory if not suppressed
    if (result.decision !== 'suppress_alert') {
      this.memory[token.address] = {
        marketCap: token.marketCap,
        lastSeen: new Date().toISOString(),
      };
    }

    // Store conversation state
    // this.conversationStates.set(threadId, result);

    // Return message if generated
    if (result.content) return result.content;
    return null;
  }

  private async decisionNode(
    state: { token: TokenData } & Record<string, any>,
  ): Promise<Record<string, any>> {
    const { token } = state;
    if (!token) {
      throw new Error('Token is required in state for decisionNode');
    }
    // Fetch recent alerts (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = await prisma.tokenAlertMemory.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    // Find previous alert for this token
    const previous = recentAlerts.find((a) => a.tokenAddress === token.address);

    // Prepare prompt for LLM
    const prompt = `
You are an alert manager. Here is the history of alerts sent today:
${recentAlerts.map((a) => `- [${a.createdAt.toISOString()}] ${a.tokenAddress} ${a.eventType} MC: ${a.marketCap}`).join('\n')}

We generate alerts hourly.

A new alert is being considered:
Token: ${token.name} (${token.symbol})
Market Cap: ${token.marketCap}
Time: ${new Date().toISOString()}

Alert Guidelines:
- Show alerts for new tokens or significant market movements
- Show alerts for tokens with interesting descriptions or unique features
- Show alerts for tokens that haven't been alerted in the last 6 hours
- Only suppress if the token was recently alerted (within 6 hours) and there's no significant change
- Consider updating existing alerts if there's a notable market cap change

Should we show this alert? Respond with one of: show_alert, suppress_alert, update_alert. Briefly justify your decision.
`;

    // Call LLM
    const model = new ChatOpenAI({ model: 'gpt-4o-mini', temperature: 0 });
    const response = await model.invoke([new HumanMessage(prompt)]);
    const content =
      typeof response.content === 'string' ? response.content : '';

    // Parse decision
    let decision: Decision = 'suppress_alert';
    if (content.includes('show_alert')) decision = 'new_alert';
    if (content.includes('update_alert')) decision = 'update_alert';

    // Save this event to memory
    await prisma.tokenAlertMemory.create({
      data: {
        tokenAddress: token.address,
        eventType: decision,
        marketCap: token.marketCap,
        extra: { ...token },
      },
    });

    return {
      ...state,
      decision,
      recentAlerts,
      llmJustification: content,
      previous,
    };
  }

  private async chatNode(
    state: {
      token: TokenData;
      decision: Decision;
      previous?: any;
      llmJustification: string;
      recentAlerts?: any[];
    } & Record<string, any>,
  ): Promise<Record<string, any>> {
    const { llmJustification, recentAlerts } = state;

    if (llmJustification) {
      const { token, decision, previous } = state;
      // Format market cap
      function formatCap(cap: number) {
        if (cap >= 1_000_000_000) return `${(cap / 1_000_000_000).toFixed(1)}B`;
        if (cap >= 1_000_000) return `${(cap / 1_000_000).toFixed(1)}M`;
        if (cap >= 1_000) return `${(cap / 1_000).toFixed(1)}K`;
        return cap.toString();
      }
      const formattedCap = formatCap(token.marketCap);
      // Calculate createdAgo
      let createdAgo = '';
      if (token.created) {
        const createdDate = new Date(token.created);
        const now = Date.now();
        const diffMs = now - createdDate.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHrs < 24) createdAgo = `${diffHrs}h ago`;
        else createdAgo = `${diffDays}d ago`;
      }
      let prompt = '';
      if (decision === 'new_alert') {
        prompt = `
Write a one-liner in a fun, casual way on why this token is being alerted as a new discovery. Using recent alerts, see what makes this token unique or worth attention. No emojis, hashtags, or hype. Be context-aware and focus on what makes this token interesting right now. Don't mention exact numbers or times. Focus on what stands out, previous alert context, and keep it fun and attention grabbing. Use phrases like 'just launched', 'making waves', 'fresh on the scene', 'new kid on the block', etc. Avoid reporting market cap or time since launch as numbers.

Here are some examples:
- We got a new runner and his name is LABUBU. It's got a fat marketcap already.
- LABUBU has been making waves. It's a new token that does some fascinating AI things.
- Brand new: LABUBU (LAB) just launched.
- ${token.name} (${token.symbol}) is fresh on the scene. Could be one to watch.

Token info:
Name: ${token.name}
Symbol: ${token.symbol}
Market Cap: ${formattedCap}
Created: ${createdAgo}
Description: ${token.description ?? ''}
Decision: ${decision}
Previous Cap: ${previous?.marketCap ?? ''}

Recent Alerts:
${recentAlerts?.map((a) => `- ${a.tokenAddress} (${a.eventType}) MC: ${a.marketCap}`).join('\n') || 'No recent alerts'}

Justification: ${llmJustification}
`;
      } else if (decision === 'update_alert') {
        prompt = `
Write a one-liner in a fun, casual way on why this token is being alerted again. Focus on momentum, change, or continued interest. Using recent alerts, see what makes this token stand out now. No emojis, hashtags, or hype. Be context-aware and focus on what makes this token interesting right now. Don't mention exact numbers or times. Use phrases like 'flying high', 'still moving', 'picking up steam', 'not slowing down', etc. Avoid reporting market cap or time since launch as numbers.

Here are some examples:
- We alerted on LABUBU before too, but this token is flying high now.
- ${token.name} (${token.symbol}) is still moving. Worth a look.
- ${token.name} is picking up steam again. Not one to ignore.
- ${token.name} keeps making noise. Let's see where it goes.

Token info:
Name: ${token.name}
Symbol: ${token.symbol}
Market Cap: ${formattedCap}
Created: ${createdAgo}
Description: ${token.description ?? ''}
Decision: ${decision}
Previous Cap: ${previous?.marketCap ?? ''}

Recent Alerts:
${recentAlerts?.map((a) => `- ${a.tokenAddress} (${a.eventType}) MC: ${a.marketCap}`).join('\n') || 'No recent alerts'}

Justification: ${llmJustification}
`;
      } else {
        prompt = `
Write a one-liner in a fun, casual way on why this token is being alerted. Using recent alerts, see what makes this token unique. No emojis, hashtags, or hype. Be context-aware and focus on what makes this token interesting right now.

Token info:
Name: ${token.name}
Symbol: ${token.symbol}
Market Cap: ${formattedCap}
Created: ${createdAgo}
Description: ${token.description ?? ''}
Decision: ${decision}
Previous Cap: ${previous?.marketCap ?? ''}

Recent Alerts:
${recentAlerts?.map((a) => `- ${a.tokenAddress} (${a.eventType}) MC: ${a.marketCap}`).join('\n') || 'No recent alerts'}

Justification: ${llmJustification}
`;
      }
      const model = new ChatOpenAI({
        model: 'gpt-4o-mini',
        temperature: 0.7,
      });
      const response = await model.invoke([
        new SystemMessage(
          'You are Maix, a Telegram trading bot that helps users find interesting token information. Be direct, cautious, and factual in your analysis. Avoid hype and focus on providing clear, useful information.',
        ),
        new HumanMessage(prompt),
      ]);
      let content: string;
      if (typeof response.content === 'string') content = response.content;
      else if (Array.isArray(response.content))
        content = response.content
          .map((part) => (typeof part === 'string' ? part : ''))
          .join('');
      else content = '';
      return { ...state, content };
    }

    return { ...state, content: '' };
  }
}
