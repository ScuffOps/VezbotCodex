import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'vezbot-fin-dashboard',
    timestamp: new Date().toISOString(),
  });
}
