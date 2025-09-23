export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { type = 'full', manual = true } = await request.json();

    if (!['full', 'quick'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid update type. Must be "full" or "quick"' },
        { status: 400 }
      );
    }

    // Mock update trigger for now
    console.log(`Triggering ${type} grant update for user ${userId}...`);

    return NextResponse.json({
      success: true,
      message: `${type} grant update started`,
      type,
      manual,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Grant update trigger error:', error);

    return NextResponse.json(
      {
        error: 'Failed to trigger grant update',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Mock status response
    const status = {
      isRunning: false,
      lastUpdate: new Date().toISOString(),
      nextUpdate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      updateType: 'scheduled'
    };

    return NextResponse.json({
      success: true,
      data: status,
      message: 'Grant update status retrieved'
    });

  } catch (error) {
    console.error('Grant update status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get grant update status',
        details: error.message
      },
      { status: 500 }
    );
  }
}