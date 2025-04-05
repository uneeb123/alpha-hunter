import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ElfaClient } from '@/utils/elfa';
import { DefiLlamaClient } from '@/utils/defillama';
import { TopMentionData } from '@/utils/elfa.types';

export class ChatAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private app: any;
  private conversationStates: Map<string, typeof MessagesAnnotation.State>;
  private elfaClient: ElfaClient;

  constructor() {
    this.elfaClient = new ElfaClient();

    const getTokenInfo = tool(
      async (input) => {
        try {
          const response = await this.elfaClient.getTopMentions({
            ticker: input.token,
            timeWindow: '24h',
            pageSize: 5,
            includeAccountDetails: true,
          });

          if (response.data.data.length === 0) {
            return `no recent mentions found for ${input.token}`;
          }

          const mentions = response.data.data
            .map(
              (m: TopMentionData) =>
                `"${m.content}" - @${m.twitter_account_info?.username || 'unknown'}`,
            )
            .join('\n');
          return `recent mentions for ${input.token}:\n${mentions}`;
        } catch {
          return `sorry, couldn't get info for ${input.token}`;
        }
      },
      {
        name: 'get_token_info',
        description: 'Get recent social mentions for a token/ticker symbol',
        schema: z.object({
          token: z.string().describe('Token/ticker symbol to get mentions for'),
        }),
      },
    );

    const getYieldInfo = tool(
      async () => {
        try {
          const client = new DefiLlamaClient();
          const pools = await client.getPools();

          const minTvlUsd = 1_000_000;

          // Apply the same filtering logic as in yield.ts
          const stableUpPools = pools.data.filter(
            (pool) => pool.predictions.predictedClass === 'Stable/Up',
          );
          const highTvlPools = stableUpPools.filter(
            (pool) => pool.tvlUsd >= minTvlUsd,
          );

          // Sort by APY and get top 3
          const topPools = highTvlPools
            .sort((a, b) => (b.apy || 0) - (a.apy || 0))
            .slice(0, 3);

          if (topPools.length === 0) {
            return 'no yield opportunities match the criteria right now.';
          }

          // Format response in a casual way
          const response = topPools
            .map(
              (pool, i) =>
                `${i + 1}. ${pool.symbol} on ${pool.project} (${pool.chain}) - ${pool.apy?.toFixed(2)}% apy`,
            )
            .join('\n');

          return `here are the top yield opportunities:\n${response}`;
        } catch {
          return 'sorry, had trouble getting yield data right now.';
        }
      },
      {
        name: 'get_yield_info',
        description: 'Get best yield generating opportunities',
        schema: z.object({
          noOp: z.string().optional().describe('No-op parameter.'),
        }),
      },
    );

    const tools = [
      new TavilySearchResults({ maxResults: 3 }),
      getYieldInfo,
      getTokenInfo,
    ];
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
            "You are an AI assistant named Max. Always be concise and direct in your responses. Avoid unnecessary explanations or verbosity. Give responses as plain text. Be hella casual. Write in lowercaps. Don't give response as Markdown",
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
}
