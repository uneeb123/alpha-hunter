import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const responses = await prisma.botResponse.findMany();
    const responseMap = responses.reduce(
      (acc, response) => {
        acc[response.name] = response;
        return acc;
      },
      {} as Record<string, any>,
    );

    return NextResponse.json(responseMap);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const responses = await request.json();

    for (const response of responses) {
      await prisma.botResponse.upsert({
        where: { name: response.name },
        update: { response: response.response },
        create: {
          name: response.name,
          response: response.response,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to save responses' },
      { status: 500 },
    );
  }
}
