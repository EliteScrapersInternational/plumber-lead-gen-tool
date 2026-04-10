import { Actor } from 'apify';

await Actor.init();

// 1. Get the new input names we set up in the form
const { locations, maxResults = 10 } = await Actor.getInput();

// 2. We loop through each city to find plumbers
for (const city of locations) {
    console.log(`🔎 Searching for plumbers in: ${city}`);

    const run = await Actor.call("apify/google-search-scraper", {
        queries: `plumbers in ${city}`,
        maxPagesPerQuery: 1,
        resultsPerPage: maxResults,
        mobileResults: false,
    });

    // 3. Get the results and save them
    const { items } = await Actor.apifyClient.dataset(run.defaultDatasetId).listItems();
    
    const processedLeads = items.map(item => ({
        businessName: item.title,
        website: item.url,
        city: city,
        needs_marketing_help: !item.url || item.url.includes('facebook.com') ? 'YES' : 'NO',
        google_link: item.url
    }));

    await Actor.pushData(processedLeads);
}

await Actor.exit();
