/*
import * as dotenv from 'dotenv';
import { search } from '../../utils/x';

dotenv.config();


async function testTwitterSearch() {
  try {
    // Call the getRecentSearchCounts function with "SEC" as the query
    console.log('Fetching recent tweets containing "SEC"...');
    const searchResults = await search('SEC');

    // Log the search results
    console.log('Search results:');
    console.log(`- Found ${searchResults.meta.result_count} tweets`);

    console.log(JSON.stringify(searchResults.data.data, null, 2));
    console.log(JSON.stringify(searchResults.data.includes, null, 2));
  } catch (error) {
    console.error('Error testing Twitter search:', error);
  }
}

// Execute the test function
testTwitterSearch()
  .then(() => console.log('Test completed'))
  .catch((err) => console.error('Test failed:', err));
*/
