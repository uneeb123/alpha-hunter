import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Debugger } from '@/utils/debugger';

const Debug = Debugger.create();
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'Missing name' }, { status: 400 });
  }
  try {
    const filter = await prisma.filter.findUnique({ where: { name } });
    return NextResponse.json(filter);
  } catch (e) {
    Debug.error('GET error', String(e));
    return NextResponse.json(
      { error: 'Failed to fetch filter' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, ...rest } = data;
    if (!name) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }
    const filter = await prisma.filter.upsert({
      where: { name },
      update: rest,
      create: { name, ...rest },
    });
    return NextResponse.json(filter);
  } catch (e) {
    Debug.error('POST error', String(e));
    return NextResponse.json(
      { error: 'Failed to update filter' },
      { status: 500 },
    );
  }
}
