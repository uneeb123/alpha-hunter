import { ChatOpenAI } from '@langchain/openai';
import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';
import { tools } from '@/utils/tools';

export class ChatAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private app: any;
  private conversationStates: Map<string, typeof MessagesAnnotation.State>;

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
}
