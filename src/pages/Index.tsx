import { useState } from "react";
import { Search, Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SentimentChart } from "@/components/SentimentChart";
import { TimelineChart } from "@/components/TimelineChart";
import { KeywordsChart } from "@/components/KeywordsChart";
import { ThreatIndicator } from "@/components/ThreatIndicator";
import { TrendsChart } from "@/components/TrendsChart";
import { RelatedQueriesTable } from "@/components/RelatedQueriesTable";
import { analyzeSentiment, type AnalysisResult } from "@/lib/sentiment";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

const Index = () => {
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!brandName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a brand name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check cache first
      const cacheKey = `narrative_${brandName.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      
      if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 3600000) {
        setResults(JSON.parse(cached));
        toast({
          title: "Loaded from cache",
          description: "Displaying cached results",
        });
        setLoading(false);
        return;
      }

      // Fetch news data
      const { data: newsData, error: newsError } = await supabase.functions.invoke("fetch-news", {
        body: { brand: brandName },
      });

      if (newsError) {
        console.error("News API error:", newsError);
        toast({
          title: "News API Error",
          description: "Failed to fetch news data",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch Reddit data (non-blocking if it fails)
      let redditPosts = [];
      const { data: redditData, error: redditError } = await supabase.functions.invoke("fetch-reddit", {
        body: { brand: brandName },
      });

      if (redditError) {
        console.warn("Reddit API unavailable:", redditError);
      } else {
        redditPosts = redditData?.posts || [];
      }

      // Fetch Google Trends data (non-blocking if it fails)
      const { data: trends, error: trendsError } = await supabase.functions.invoke("fetch-trends", {
        body: { brand: brandName },
      });

      if (trendsError) {
        console.warn("Trends API unavailable:", trendsError);
        setTrendsData(null);
      } else {
        setTrendsData(trends);
      }

      // Combine and analyze data
      const allMentions = [
        ...(newsData?.articles || []).map((a: any) => ({
          text: `${a.title} ${a.description}`,
          source: "news",
          date: new Date(a.publishedAt),
        })),
        ...redditPosts.map((p: any) => ({
          text: `${p.title} ${p.selftext}`,
          source: "reddit",
          date: new Date(p.created_utc * 1000),
          score: p.score,
        })),
      ];

      if (allMentions.length === 0) {
        toast({
          title: "No results",
          description: "No mentions found for this brand",
        });
        setLoading(false);
        return;
      }

      const analysis = await analyzeSentiment(allMentions);
      setResults(analysis);

      // Cache results
      localStorage.setItem(cacheKey, JSON.stringify(analysis));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      toast({
        title: "Analysis complete",
        description: `Found ${allMentions.length} mentions`,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById("dashboard");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: "#050505",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${brandName}_narrative_snapshot.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Snapshot downloaded",
        description: "Dashboard exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export dashboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight">
            808080 – <span className="text-primary">The Grey Zone</span> Narrative Intelligence
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time brand narrative tracking and threat analysis
          </p>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-border">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Input
                placeholder="Enter brand or organisation name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading} className="min-w-[120px]">
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {results && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Snapshot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Dashboard */}
        {results && (
          <div id="dashboard" className="mt-8 space-y-6">
            {/* Threat Indicator */}
            <ThreatIndicator
              threatLevel={results.threatLevel}
              threatScore={results.threatScore}
            />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SentimentChart data={results.sentimentDistribution} />
              <TimelineChart data={results.timeline} />
            </div>

            <KeywordsChart data={results.keywords} />

            {/* Google Trends Data */}
            {trendsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrendsChart 
                  data={trendsData?.interest_over_time?.timeline_data?.map((item: any) => ({
                    date: item.date,
                    value: item.values?.[0]?.value || 0
                  })) || []}
                />
                <RelatedQueriesTable 
                  data={trendsData?.related_queries?.rising?.map((item: any) => ({
                    query: item.query,
                    value: item.value
                  })) || []}
                />
              </div>
            )}

            {/* Disclaimer */}
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Results generated from live public data. This is an MVP with limited accuracy.
                  Data sources: NewsAPI and Reddit. Sentiment analysis powered by AI models.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
