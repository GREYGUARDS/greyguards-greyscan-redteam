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
  { name: "The Economist", url: "https://www.economist.com/international/rss.xml", country: "UK" },

  // US
  { name: "CNN", url: "http://rss.cnn.com/rss/cnn_topstories.rss", country: "US" },
  { name: "New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", country: "US" },
  { name: "Washington Post", url: "http://feeds.washingtonpost.com/rss/world", country: "US" },
  { name: "Fox News", url: "https://moxie.foxnews.com/google-publisher/latest.xml", country: "US" },
  { name: "USA Today", url: "http://rssfeeds.usatoday.com/usatoday-NewsTopStories", country: "US" },
  { name: "Wall Street Journal", url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", country: "US" },
  { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml", country: "US" },
  { name: "CBS News", url: "https://www.cbsnews.com/latest/rss/world", country: "US" },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", country: "US" },

  // Europe
  { name: "Der Spiegel", url: "https://www.spiegel.de/international/index.rss", country: "Germany" },
  { name: "Deutsche Welle", url: "https://rss.dw.com/rdf/rss-en-all", country: "Germany" },
  { name: "Le Monde", url: "https://www.lemonde.fr/en/rss/une.xml", country: "France" },
  { name: "France 24", url: "https://www.france24.com/en/rss", country: "France" },
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

  // Canada
  { name: "Globe and Mail", url: "https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/", country: "Canada" },

  // Tech & Business
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", country: "US" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", country: "US" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml", country: "US" },
];

// deno_dom cannot parse "text/xml" (throws "unimplemented"), which silently zeroed out
// every feed. Parse RSS/Atom items with regex instead.
function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (match) return decodeEntities(match[1]);
  // Atom links use an attribute
  if (tag === 'link') {
    const href = block.match(/<link[^>]*href=["']([^"']+)["']/i);
    if (href) return href[1];
  }
  return '';
}

function parseItems(xmlText: string): string[] {
  const rssItems = xmlText.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  if (rssItems.length > 0) return rssItems;
  return xmlText.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
}

async function fetchRSS(feed: typeof NEWS_FEEDS[0], brand: string): Promise<any[]> {
  try {
    // Feeds are static endpoints - never append query params (breaks feeds like FT/CNBC)
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`${feed.name} RSS failed:`, response.status);
      return [];
    }

    const xmlText = await response.text();
    const needle = brand.toLowerCase();

    if (!xmlText.toLowerCase().includes(needle)) {
      return [];
    }

    const articles = parseItems(xmlText)
      .map((block) => {
        const title = tagValue(block, 'title');
        const description = tagValue(block, 'description') || tagValue(block, 'summary') || tagValue(block, 'content');
        const url = tagValue(block, 'link') || tagValue(block, 'guid');
        const publishedAt = tagValue(block, 'pubDate') || tagValue(block, 'updated') || tagValue(block, 'published') || new Date().toISOString();

        if (!title || !url) return null;
        if (!title.toLowerCase().includes(needle) && !description.toLowerCase().includes(needle)) {
          return null;
        }

        return {
          title,
          text: description,
          url,
          publishedAt,
          source: feed.name,
          country: feed.country,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .slice(0, 8);

    if (articles.length > 0) {
      console.log(`${feed.name}: ${articles.length} matching articles`);
    }

    return articles;
  } catch (error) {
    console.warn(`Error fetching ${feed.name}:`, error instanceof Error ? error.message : error);
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
