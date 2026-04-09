import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { workspaceId, title } = await req.json();
    const id = crypto.randomUUID();
    const conversation = {
      id,
      workspaceId,
      title: title || '新對話',
      messages: [],
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ conversation });
  } catch {
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { conversationId } = await req.json();
    return NextResponse.json({ success: true, conversationId });
  } catch {
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { conversationId, title, pinned } = await req.json();
    return NextResponse.json({ success: true, conversationId, title, pinned });
  } catch {
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
