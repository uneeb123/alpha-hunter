import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { tokenAddress, isMonitoring } = await request.json();

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'Token address is required' },
        { status: 400 },
      );
    }

    const monitor = await prisma.tokenMonitor.upsert({
      where: { tokenAddress },
      update: {
        isMonitoring,
        updatedAt: new Date(),
      },
      create: {
        tokenAddress,
        isMonitoring,
      },
    });

    return NextResponse.json({ success: true, monitor });
  } catch (error) {
    console.error('Error toggling monitor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to toggle monitoring' },
      { status: 500 },
    );
  }
}
