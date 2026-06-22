import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Major global news outlets RSS feeds
const NEWS_FEEDS = [
  // UK
  { name: "BBC News", url: "http://feeds.bbci.co.uk/news/rss.xml", country: "UK" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss", country: "UK" },
  { name: "Daily Mail", url: "https://www.dailymail.co.uk/home/index.rss", country: "UK" },
  { name: "The Telegraph", url: "https://www.telegraph.co.uk/rss.xml", country: "UK" },
  { name: "The Independent", url: "https://www.independent.co.uk/rss", country: "UK" },
  { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/home.xml", country: "UK" },
  { name: "Financial Times", url: "https://www.ft.com/?format=rss", country: "UK" },
  
  // US
  { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", country: "US" },
  { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", country: "US" },
  { name: "Washington Post", url: "http://feeds.washingtonpost.com/rss/world", country: "US" },
  { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml", country: "US" },
  { name: "USA Today", url: "http://rssfeeds.usatoday.com/usatoday-NewsTopStories", country: "US" },
  { name: "Wall Street Journal", url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", country: "US" },
  { name: "Politico", url: "https://www.politico.com/rss/politics08.xml", country: "US" },
  
  // Europe
  { name: "Der Spiegel", url: "https://www.spiegel.de/international/index.rss", country: "Germany" },
  { name: "Le Monde", url: "https://www.lemonde.fr/en/rss/une.xml", country: "France" },
  { name: "El País", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/english.elpais.com/portada", country: "Spain" },
  { name: "Corriere della Sera", url: "https://xml2.corriereobjects.it/rss/homepage.xml", country: "Italy" },
  { name: "NRC", url: "https://www.nrc.nl/rss/", country: "Netherlands" },
  
  // Asia-Pacific
  { name: "South China Morning Post", url: "https://www.scmp.com/rss/91/feed", country: "Hong Kong" },
  { name: "The Japan Times", url: "https://www.japantimes.co.jp/feed/", country: "Japan" },
  { name: "The Times of India", url: "https://timesofindia.indiatimes.com/rssfeedstopstories.cms", country: "India" },
  { name: "The Sydney Morning Herald", url: "https://www.smh.com.au/rss/feed.xml", country: "Australia" },
  { name: "Straits Times", url: "https://www.straitstimes.com/news/world/rss.xml", country: "Singapore" },
  
  // Middle East
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", country: "Qatar" },
  { name: "Haaretz", url: "https://www.haaretz.com/cmlink/1.628767", country: "Israel" },
  
  // Canada
  { name: "CBC News", url: "https://www.cbc.ca/webfeed/rss/rss-topstories", country: "Canada" },
  { name: "Globe and Mail", url: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/", country: "Canada" },
  
  // Tech & Business
  { name: "Reuters", url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best", country: "UK" },
  { name: "Bloomberg", url: "https://feeds.bloomberg.com/markets/news.rss", country: "US" },
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", country: "US" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", country: "US" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", country: "US" },
];

async function fetchRSS(feed: typeof NEWS_FEEDS[0], brand: string): Promise<any[]> {
  try {
    const searchUrl = feed.url.includes('?') 
      ? `${feed.url}&q=${encodeURIComponent(brand)}`
      : feed.url;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      console.warn(`${feed.name} RSS failed:`, response.status);
      return [];
    }

    const xmlText = await response.text();
    
    // Check if brand is mentioned in the feed
    if (!xmlText.toLowerCase().includes(brand.toLowerCase())) {
      return [];
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    
    if (!doc) return [];

    const items = doc.querySelectorAll("item");
    
    return Array.from(items).slice(0, 5).map((item) => {
      const element = item as any;
      const titleEl = element.querySelector("title");
      const linkEl = element.querySelector("link");
      const descEl = element.querySelector("description");
      const pubDateEl = element.querySelector("pubDate");
      
      const title = titleEl?.textContent || "";
      const description = descEl?.textContent || "";
      
      // Only include if brand is mentioned
      if (!title.toLowerCase().includes(brand.toLowerCase()) && 
          !description.toLowerCase().includes(brand.toLowerCase())) {
        return null;
      }
      
      return {
        title,
        text: description.replace(/<[^>]*>/g, ''),
        url: linkEl?.textContent || "",
        publishedAt: pubDateEl?.textContent || new Date().toISOString(),
        source: feed.name,
        country: feed.country,
      };
    }).filter((article): article is NonNullable<typeof article> => 
      article !== null && article.title && article.url
    );
  } catch (error) {
    console.warn(`Error fetching ${feed.name}:`, error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication (anonymous/guest sessions count as authenticated)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    console.log("Aggregating RSS feeds for:", brand);

    // Fetch all feeds in parallel with a timeout
    const results = await Promise.allSettled(
      NEWS_FEEDS.map(feed => fetchRSS(feed, brand))
    );

    // Flatten and collect all articles
    const allArticles = results
      .filter((result): result is PromiseFulfilledResult<any[]> => 
        result.status === "fulfilled"
      )
      .flatMap(result => result.value);

    // Get unique sources that returned results
    const sourcesUsed = [...new Set(allArticles.map(a => a.source))];
    
    console.log(`Found ${allArticles.length} articles from ${sourcesUsed.length} sources`);

    return new Response(
      JSON.stringify({ 
        articles: allArticles,
        sources: sourcesUsed,
        totalFeeds: NEWS_FEEDS.length,
        activeSources: sourcesUsed.length
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in fetch-rss-aggregator:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, articles: [], sources: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
