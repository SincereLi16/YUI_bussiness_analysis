import { getSystemPrompt } from './systemPrompt';

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json();
    const selectedMode = mode === 'audit' ? 'audit' : 'casual';

    // Get the latest user message to feed into the RAG filter
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()?.content || '';

    const systemPrompt = {
      role: 'system',
      content: getSystemPrompt(selectedMode, lastUserMessage),
    };

    const apiMessages = [systemPrompt, ...messages];

    const deepseekKey = process.env.DEEPSEEK_API_KEY && !process.env.DEEPSEEK_API_KEY.startsWith('sk-or-')
      ? process.env.DEEPSEEK_API_KEY
      : undefined;

    const openRouterKey = process.env.OPENROUTER_API_KEY || (process.env.DEEPSEEK_API_KEY?.startsWith('sk-or-') ? process.env.DEEPSEEK_API_KEY : undefined);

    const provider = openRouterKey ? 'openrouter' : deepseekKey ? 'deepseek' : 'missing';
    if (provider === 'missing') {
      return new Response(JSON.stringify({ error: 'Missing API key: set OPENROUTER_API_KEY or DEEPSEEK_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.deepseek.com/chat/completions';

    const model = provider === 'openrouter'
      ? (process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001')
      : (process.env.DEEPSEEK_MODEL || 'deepseek-chat');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider === 'openrouter' ? openRouterKey : deepseekKey}`,
    };

    if (provider === 'openrouter') {
      const referer = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;
      if (referer) headers['HTTP-Referer'] = referer;
      headers['X-Title'] = 'Youth Consumer';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      console.error('Chat provider error:', {
        provider,
        status: response.status,
        statusText: response.statusText,
        body: bodyText.slice(0, 500),
      });
      throw new Error(`${provider} API error: ${response.status} ${response.statusText}`);
    }

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
