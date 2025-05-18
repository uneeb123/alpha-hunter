import { Pinecone } from '@pinecone-database/pinecone';
import { getSecrets } from '@/utils/secrets';

const secrets = getSecrets();
const pinecone = new Pinecone({ apiKey: secrets.pineconeApiKey }).Index(
  'tweets-embed',
);

// Supports ?numBatches=3 (default 1, max 10). Each batch is 100 vectors.
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    let numBatches = parseInt(url.searchParams.get('numBatches') || '1', 10);
    if (isNaN(numBatches) || numBatches < 1) numBatches = 1;
    if (numBatches > 10) numBatches = 10;

    const BATCH_SIZE = 100;
    let nextToken: string | undefined = undefined;
    const allIds: string[] = [];
    for (let batch = 0; batch < numBatches; batch++) {
      const result: any = await pinecone.listPaginated({
        limit: BATCH_SIZE,
        paginationToken: nextToken,
      });
      if (result?.vectors) {
        allIds.push(...result.vectors.map((v: any) => v.id));
      }
      nextToken = result?.pagination?.next;
      if (!nextToken) break;
    }

    if (!allIds.length) {
      return Response.json([]);
    }

    // Fetch all vectors in batches of 100
    const allVectors = [];
    for (let i = 0; i < allIds.length; i += BATCH_SIZE) {
      const batchIds = allIds.slice(i, i + BATCH_SIZE);
      const vectorsResult: any = await pinecone.fetch(batchIds);
      const vectors = vectorsResult?.records || {};
      for (const id of batchIds) {
        const v = vectors[id];
        if (v) {
          allVectors.push({ id, ...v });
        }
      }
    }
    return Response.json(allVectors);
  } catch (error) {
    console.error('Error fetching all Pinecone vectors:', error);
    return new Response('Error fetching Pinecone vectors', { status: 500 });
  }
}
