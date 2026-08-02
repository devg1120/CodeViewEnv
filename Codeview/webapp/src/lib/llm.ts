import OpenAI from 'openai'

export interface LLMResponse {
  answer: string
  highlightNodes: string[]
  reasoning: Record<string, string>
}

const HIGHLIGHT_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'highlight_nodes',
    description: 'Answer the question and return the file paths most relevant to the answer so they can be highlighted on the graph',
    parameters: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'Concise answer to the question (2-4 sentences)'
        },
        highlightNodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File path IDs (e.g. "packages/ai/src/index.ts") most relevant to the answer. Use exact paths from the skeleton.'
        }
      },
      required: ['answer', 'highlightNodes']
    }
  }
}

const SYSTEM = `You are an expert software architect analyzing a codebase skeleton (imports and signatures only).
Answer questions concisely (2-4 sentences). Always call highlight_nodes — return the exact file paths from the skeleton that are most relevant. Return 3-10 nodes; never return all of them.`

// Free model on OpenRouter with reliable tool-calling support
const MODEL = 'meta-llama/llama-3.3-70b-instruct:free'

export async function askAboutCodebase(
  question: string,
  skeletonContext: string
): Promise<LLMResponse> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
  if (!apiKey) {
    return {
      answer: 'Add VITE_OPENROUTER_API_KEY=your_key to webapp/.env and restart the dev server. Get a free key at openrouter.ai.',
      highlightNodes: [],
      reasoning: {}
    }
  }

  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    dangerouslyAllowBrowser: true
  })

  // Cap skeleton at 400 lines to stay within free-tier context limits
  const lines = skeletonContext.split('\n')
  const skeleton = lines.length > 400
    ? lines.slice(0, 400).join('\n') + '\n\n[...truncated...]'
    : skeletonContext

  const response = await client.chat.completions.create({
    model: MODEL,
    tools: [HIGHLIGHT_TOOL],
    tool_choice: { type: 'function', function: { name: 'highlight_nodes' } },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Codebase skeleton:\n\`\`\`\n${skeleton}\n\`\`\`\n\nQuestion: ${question}` }
    ]
  })

  const msg = response.choices[0]?.message
  const call = msg?.tool_calls?.[0]

  if (call && 'function' in call && call.function.name === 'highlight_nodes') {
    const args = JSON.parse(call.function.arguments) as { answer: string; highlightNodes: string[] }
    return {
      answer: args.answer ?? '',
      highlightNodes: args.highlightNodes ?? [],
      reasoning: {}
    }
  }

  // Fallback: plain text, no highlights
  return {
    answer: msg?.content ?? 'No response.',
    highlightNodes: [],
    reasoning: {}
  }
}
