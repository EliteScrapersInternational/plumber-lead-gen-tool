import { Actor } from 'apify';

await Actor.init();

// 1. Get the input names we set up in the form
const { locations, maxResults = 10 } = await Actor.getInput();

// 2. Loop through each city to find plumbers
for (const city of locations) {
    console.log(`🔎 Searching for plumbers in: ${city}`);

    // Call the Google Search Scraper
    const run = await Actor.call("apify/google-search-scraper", {
        queries: `plumbers in ${city}`,
        maxPagesPerQuery: 1,
        resultsPerPage: maxResults,
        mobileResults: false,
    });

    // 3. Get the raw dataset items from the scraper
    const { items } = await Actor.apifyClient.dataset(run.defaultDatasetId).listItems();
    
    // 4. Create an empty array to hold the actual plumbers
    const processedLeads = [];
    
    // 5. Drill down into the "organicResults" where the actual businesses live
    for (const item of items) {
        if (item.organicResults && Array.isArray(item.organicResults)) {
            for (const result of item.organicResults) {
                
                // Logic: Does this plumber have a real website?
                const hasWebsite = result.url && 
                                 !result.url.includes('google.com') && 
                                 !result.url.includes('facebook.com') && 
                                 !result.url.includes('yelp.com');

                // Build the individual lead
                processedLeads.push({
                    businessName: result.title,
                    website: result.url || 'No website found',
                    city: city,
                    needs_marketing_help: hasWebsite ? 'NO' : 'YES',
                    opportunityScore: hasWebsite ? 20 : 90, // Note: camelCase matches the output schema you made earlier!
                    google_link: result.url
                });
            }
        }
    }

    // 6. Push all the individual leads for this city to your dataset at once
    if (processedLeads.length > 0) {
        await Actor.pushData(processedLeads);
        console.log(`✅ Successfully saved ${processedLeads.length} leads for ${city}`);
    } else {
        console.log(`⚠️ No leads found for ${city}`);
    }
}

await Actor.exit();
