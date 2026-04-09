import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

const MODEL_MAP = {
  'gpt-4o': 'gpt-4o',
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'gemini-1.5-pro': 'gemini-1.5-pro',
};

export async function POST(req: NextRequest) {
  try {
    const { messages, model, plugins = [] } = await req.json();

    // Web search plugin (DuckDuckGo)
    let webSearchResult: string | null = null;
    if (plugins.includes('web_search')) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        try {
          const searchRes = await fetch(
            `https://api.duckduckgo.com/?q=${encodeURIComponent(lastUserMsg.content)}&format=json&no_html=1`,
            { signal: AbortSignal.timeout(5000) }
          );
          const data = await searchRes.json();
          if (data.AbstractText) {
            webSearchResult = `${data.AbstractText}\n\n來源：${data.AbstractURL || data.SourceURL || 'DuckDuckGo'}`;
          } else if (data.RelatedTopics?.length > 0) {
            const snippet = data.RelatedTopics[0]?.Text || '';
            webSearchResult = `${snippet}\n\n來源：${data.RelatedTopics[0]?.FirstURL || 'DuckDuckGo'}`;
          }
        } catch {}
      }
    }

    let reply = '';
    const history = messages.filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant').slice(-20);
    if (webSearchResult) {
      history.push({
        role: 'user' as const,
        content: `參考以下網路搜尋結果回答：\n${webSearchResult}`
      });
    }

    if (model === 'gpt-4o') {
      const res = await openai.chat.completions.create({
        model: MODEL_MAP[model as keyof typeof MODEL_MAP] || 'gpt-4o',
        messages: history as OpenAI.Chat.ChatCompletionMessage[],
        max_tokens: 2048,
        temperature: 0.7,
      });
      reply = res.choices[0]?.message?.content || '模型未回覆';

    } else if (model === 'claude-3-5-sonnet') {
      const res = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: history as unknown as Anthropic.MessageParam[],
      });
      reply = res.content[0].type === 'text' ? res.content[0].text : '模型未回覆';

    } else if (model === 'gemini-1.5-pro') {
      const genAI = googleAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = history.map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');
      const res = await genAI.generateContent(prompt);
      reply = res.response.text() || '模型未回覆';
    }

    if (webSearchResult && reply) {
      reply += `\n\n---\n🔍 網路搜尋結果已整合`;
    }

    return NextResponse.json({ reply, model });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
