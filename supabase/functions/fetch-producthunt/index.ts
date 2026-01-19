import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();
    
    if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Brand name required", products: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanBrand = brand.trim().substring(0, 100);
    console.log("Fetching Product Hunt products for:", cleanBrand);

    // Product Hunt has a public GraphQL API - we'll use the simpler posts endpoint
    // Note: Full API requires OAuth, but we can access featured/recent posts
    
    // Use the public website API that powers search
    const searchUrl = `https://www.producthunt.com/frontend/graphql`;
    
    const graphqlQuery = {
      query: `
        query SearchProducts($query: String!) {
          posts(query: $query, first: 30) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                commentsCount
                createdAt
                featuredAt
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
                makers {
                  name
                  username
                }
              }
            }
          }
        }
      `,
      variables: { query: cleanBrand }
    };

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'IntelligenceBot/1.0',
      },
      body: JSON.stringify(graphqlQuery),
    });

    let products: any[] = [];

    if (response.ok) {
      const data = await response.json();
      const edges = data?.data?.posts?.edges || [];
      
      products = edges.map((edge: any) => {
        const node = edge.node;
        return {
          id: node.id,
          name: node.name || '',
          tagline: node.tagline || '',
          description: node.description || node.tagline || '',
          text: `${node.name}: ${node.tagline}. ${node.description || ''}`,
          url: node.url || `https://www.producthunt.com/posts/${node.id}`,
          votes: node.votesCount || 0,
          comments: node.commentsCount || 0,
          created: node.createdAt || node.featuredAt || new Date().toISOString(),
          topics: (node.topics?.edges || []).map((t: any) => t.node?.name).filter(Boolean),
          makers: (node.makers || []).map((m: any) => m.name).filter(Boolean),
        };
      });
    } else {
      // Fallback: Try scraping the search results page structure
      console.warn("Product Hunt GraphQL failed, trying alternative...");
      
      // Alternative: Use their RSS feed for recent products
      const rssUrl = `https://www.producthunt.com/feed`;
      const rssResponse = await fetch(rssUrl, {
        headers: { 'User-Agent': 'IntelligenceBot/1.0' }
      });
      
      if (rssResponse.ok) {
        const rssText = await rssResponse.text();
        const brandLower = cleanBrand.toLowerCase();
        
        // Simple RSS parsing for items
        const itemRegex = /<item>([\s\S]*?)<\/item>/g;
        let match;
        
        while ((match = itemRegex.exec(rssText)) !== null && products.length < 20) {
          const itemXml = match[1];
          const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
          const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
          const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
          const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
          
          const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
          const description = descMatch ? descMatch[1] : '';
          
          // Filter to items mentioning the brand
          if (title.toLowerCase().includes(brandLower) || description.toLowerCase().includes(brandLower)) {
            products.push({
              id: `ph-${products.length}`,
              name: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
              tagline: '',
              description: description.replace(/<[^>]*>/g, '').trim(),
              text: `${title}: ${description}`,
              url: linkMatch ? linkMatch[1] : '',
              votes: 0,
              comments: 0,
              created: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
              topics: [],
              makers: [],
            });
          }
        }
      }
    }

    console.log(`Found ${products.length} Product Hunt products`);

    return new Response(
      JSON.stringify({ products }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Product Hunt error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, products: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
