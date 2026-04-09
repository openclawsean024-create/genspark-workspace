import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  return NextResponse.json({ workspaceId });
}

export async function POST(req: NextRequest) {
  try {
    const { name, userId } = await req.json();
    const id = crypto.randomUUID();
    const workspace = {
      id,
      name: name || '新 Workspace',
      description: '',
      ownerId: userId || 'anonymous',
      members: [{ userId: userId || 'anonymous', email: '', role: 'owner' as const }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ workspace });
  } catch {
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { workspaceId } = await req.json();
    return NextResponse.json({ success: true, workspaceId });
  } catch {
    return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 });
  }
}
