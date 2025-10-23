import { useState } from "react";
import { Search, Download, AlertTriangle, Shield } from "lucide-react";
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
import { NegativityTrendIndicator } from "@/components/NegativityTrendIndicator";
import { RecommendedActions } from "@/components/RecommendedActions";
import { CounterNarrativeStatement } from "@/components/CounterNarrativeStatement";
import { MentionsTicker } from "@/components/MentionsTicker";
import { analyzeSentiment, type AnalysisResult } from "@/lib/sentiment";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from "html2canvas";

const Index = () => {
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [allMentions, setAllMentions] = useState<any[]>([]);
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
      const mentions = [
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

      if (mentions.length === 0) {
        toast({
          title: "No results",
          description: "No mentions found for this brand",
        });
        setLoading(false);
        return;
      }

      setAllMentions(mentions);
      const analysis = await analyzeSentiment(mentions);
      setResults(analysis);

      // Cache results
      localStorage.setItem(cacheKey, JSON.stringify(analysis));
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      toast({
        title: "Analysis complete",
        description: `Found ${mentions.length} mentions`,
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
      <header className="border-b-4 border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight uppercase">
                808080 <span className="text-primary">│</span> THE GREY ZONE
              </h1>
              <p className="text-muted-foreground mt-1 uppercase text-sm tracking-wider">
                Narrative Intelligence System
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-8">
        <Card className="border-4 border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="ENTER TARGET BRAND OR ORGANIZATION"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-12 uppercase tracking-wider border-2 h-12"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="min-w-[140px] h-12 uppercase tracking-wider">
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Analyzing
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Analyze
                  </>
                )}
              </Button>
            </div>
            {results && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleDownload} variant="outline" size="sm" className="uppercase tracking-wider">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
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

            {/* Mentions Ticker */}
            <MentionsTicker mentions={allMentions} brandName={brandName} />

            {/* Google Trends Data */}
            {trendsData && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrendsChart 
                    data={trendsData?.interest_over_time?.timeline_data?.map((item: any) => ({
                      date: item.date,
                      value: item.values?.[0]?.value || 0
                    })) || []}
                  />
                  <NegativityTrendIndicator
                    currentNegative={trendsData?.related_queries?.rising?.filter((q: any) => 
                      q.query.toLowerCase().includes('scam') || 
                      q.query.toLowerCase().includes('fraud') || 
                      q.query.toLowerCase().includes('problem') ||
                      q.query.toLowerCase().includes('issue') ||
                      q.query.toLowerCase().includes('complaint')
                    ).length || 0}
                    previousNegative={trendsData?.related_queries?.top?.filter((q: any) => 
                      q.query.toLowerCase().includes('scam') || 
                      q.query.toLowerCase().includes('fraud') || 
                      q.query.toLowerCase().includes('problem') ||
                      q.query.toLowerCase().includes('issue') ||
                      q.query.toLowerCase().includes('complaint')
                    ).length || 0}
                    totalQueries={trendsData?.related_queries?.rising?.length || 0}
                  />
                </div>
                <RelatedQueriesTable 
                  data={trendsData?.related_queries?.rising?.map((item: any) => ({
                    query: item.query,
                    value: item.value
                  })) || []}
                />
              </>
            )}

            {/* Recommended Actions */}
            <RecommendedActions
              threatLevel={results.threatLevel}
              negativePercentage={Math.round(
                (results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0) /
                (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100
              )}
              brandName={brandName}
              sentimentDistribution={{
                positive: Math.round((results.sentimentDistribution.find(s => s.name === "Positive")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100),
                neutral: Math.round((results.sentimentDistribution.find(s => s.name === "Neutral")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100),
                negative: Math.round((results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100)
              }}
              keywords={results.keywords}
            />

            {/* Counter-Narrative Statement */}
            <CounterNarrativeStatement
              brandName={brandName}
              keywords={results.keywords}
              sentimentDistribution={{
                positive: Math.round((results.sentimentDistribution.find(s => s.name === "Positive")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100),
                neutral: Math.round((results.sentimentDistribution.find(s => s.name === "Neutral")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100),
                negative: Math.round((results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100)
              }}
              threatLevel={results.threatLevel}
            />

            {/* Disclaimer */}
            <Card className="border-4 border-border bg-secondary">
              <CardHeader className="border-b-4 border-border">
                <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
                  <AlertTriangle className="h-5 w-5" />
                  System Disclaimer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  Results generated from live public data // MVP system with limited accuracy //
                  Data sources: NewsAPI + Reddit // Sentiment analysis: AI-powered models
                </p>
              </CardContent>
            </Card>

            {/* Consultation CTA */}
            <div className="border-t border-border pt-8 mt-8">
              <div className="text-center bg-card border-4 border-border p-10 rounded-sm">
                <h3 className="text-2xl font-semibold text-foreground uppercase tracking-wider mb-4">
                  Ready to take control of your Grey Zone narrative?
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base mb-6 leading-relaxed">
                  The 808080 system combines AI analysis with human strategic communications expertise.
                  Book a <strong className="text-foreground">Grey Zone Consultation</strong> to develop your organisation's misinformation defence strategy.
                </p>
                <a
                  href={`mailto:yourname@yourdomain.com?subject=Grey Zone Consultation Request - ${brandName}`}
                  className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-sm font-semibold uppercase tracking-wider transition-colors hover:bg-[hsl(0,0%,62%)] no-underline"
                >
                  📩 Book a Consultation
                </a>
                <p className="text-xs text-muted-foreground mt-6 uppercase tracking-wider">
                  808080 – AI-powered narrative intelligence for the grey zone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
