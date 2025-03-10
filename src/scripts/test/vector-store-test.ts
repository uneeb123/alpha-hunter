import { VectorStore } from '@/utils/vector_store';
import { getSecrets } from '@/utils/secrets';
import { Debugger, DebugConfig } from '@/utils/debugger';

async function testVectorStore() {
  // Configure debugger to output to console
  const debugConfig: DebugConfig = {
    enabled: true,
    level: 'verbose'
  };
  
  const debug = Debugger.create(debugConfig);
  console.log('Starting vector store test');
  
  const secrets = getSecrets();
  const vectorStore = VectorStore.getInstance(secrets.openaiApiKey);
  
  // First test: similaritySearch with actual query
  console.log('\n--- Test 1: similaritySearch with query ---');
  const searchResults = await vectorStore.similaritySearch('test query', 10);
  console.log(`similaritySearch found ${searchResults.length} results`);
  
  if (searchResults.length > 0) {
    console.log('Sample result:');
    console.log(`Page content: ${searchResults[0].pageContent.substring(0, 100)}...`);
    console.log(`Metadata: ${JSON.stringify(searchResults[0].metadata)}`);
  }
  
  // Second test: getRecentNewsHeadlines with same limit
  console.log('\n--- Test 2: getRecentNewsHeadlines ---');
  const headlines = await vectorStore.getRecentNewsHeadlines(10);
  console.log(`getRecentNewsHeadlines found ${headlines.length} headlines`);
  console.log(`Headlines: ${JSON.stringify(headlines)}`);
  
  // Third test: Direct similaritySearch with empty query
  console.log('\n--- Test 3: similaritySearch with EMPTY query ---');
  const emptyResults = await vectorStore.similaritySearch('', 10);
  console.log(`similaritySearch with empty query found ${emptyResults.length} results`);
  
  if (emptyResults.length > 0) {
    console.log('Sample result:');
    console.log(`Page content: ${emptyResults[0].pageContent.substring(0, 100)}...`);
    console.log(`Metadata: ${JSON.stringify(emptyResults[0].metadata)}`);
  }
  
  // Fourth test: Add a test document and search for it
  console.log('\n--- Test 4: Add test document ---');
  try {
    await vectorStore.addDocuments([
      {
        pageContent: "This is a test news item created for debugging",
        metadata: {
          headline: "Test News Headline for Debugging",
          summary: "Test summary",
          source: "test-source",
          timestamp: new Date().toISOString(),
          type: "news_item"
        }
      }
    ]);
    
    console.log('Test document added, now searching again');
    
    // Try similarity search
    const postAddResults = await vectorStore.similaritySearch('test', 5);
    console.log(`After adding: similaritySearch found ${postAddResults.length} results`);
    
    // Try getRecentNewsHeadlines
    const postAddHeadlines = await vectorStore.getRecentNewsHeadlines(5);
    console.log(`After adding: getRecentNewsHeadlines found ${postAddHeadlines.length} headlines`);
    console.log(`Headlines: ${JSON.stringify(postAddHeadlines)}`);
    
  } catch (error) {
    console.error('Error in add document test:', error);
  }
}

// Run the test
testVectorStore()
  .then(() => console.log('Test completed'))
  .catch((error) => console.error('Test failed:', error));