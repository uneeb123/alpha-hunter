import { prisma } from '@/lib/prisma';

export async function getCryptoNews(): Promise<string> {
  try {
    const response = await prisma.botResponse.findUnique({
      where: { name: 'Trending Crypto News' },
    });
    return response?.response || 'No response found';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch crypto news',
    );
  }
}

export async function getEmergingMemecoins(): Promise<string> {
  try {
    const response = await prisma.botResponse.findUnique({
      where: { name: 'Emerging Memecoins' },
    });
    return response?.response || 'No response found';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch memecoin news',
    );
  }
}

export async function getRecentNFTMints(): Promise<string> {
  try {
    const response = await prisma.botResponse.findUnique({
      where: { name: 'Recent NFT Mints' },
    });
    return response?.response || 'No response found';
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Failed to fetch NFT mints',
    );
  }
}
