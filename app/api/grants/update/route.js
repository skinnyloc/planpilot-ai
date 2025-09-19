import { NextResponse } from 'next/server';
import { grantUpdateScheduler } from "@/lib/services/grantUpdateScheduler.js";

export async function POST(request) {
  try {
    const { type = 'full', manual = true } = await request.json();

    // TODO: Add authentication check for admin users
    // if (!isAdmin(request)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    if (!['full', 'quick'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid update type. Must be "full" or "quick"' },
        { status: 400 }
      );
    }

    // Trigger manual update
    console.log(`Triggering ${type} grant update...`);

    // Start update in background
    const updatePromise = grantUpdateScheduler.triggerManualUpdate(type);

    // Don't wait for completion, return immediately
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
    // Get scheduler status
    const status = grantUpdateScheduler.getStatus();

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