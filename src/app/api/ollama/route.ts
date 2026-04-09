import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages, model = 'llama3', ollamaUrl = 'http://localhost:11434' } = await req.json();

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: messages.slice(-10),
        stream: false,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error: `Ollama error: ${error}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.message?.content || '', model: 'ollama' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ollama unavailable';
    return NextResponse.json(
      { error: `無法連接 Ollama。請確認 Ollama 已啟動（localhost:11434）：${msg}` },
      { status: 503 }
    );
  }
}
