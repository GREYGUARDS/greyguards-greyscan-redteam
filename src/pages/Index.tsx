import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, Download, AlertTriangle, Send, LogOut, Users, ChevronDown, Target, FileText } from "lucide-react";
import greyguardsLogo from "@/assets/greyguards-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import SentimentTrendComparison from "@/components/SentimentTrendComparison";
import StrategicRecommendations from "@/components/StrategicRecommendations";
import SourcesTable from "@/components/SourcesTable";
import { GDELTEntitiesChart } from "@/components/GDELTEntitiesChart";
import { GDELTLocationsMap } from "@/components/GDELTLocationsMap";
import { GDELTThemesChart } from "@/components/GDELTThemesChart";
import { MDMNarrativesTracker } from "@/components/MDMNarrativesTracker";
import { EmergingNarrativesPrediction } from "@/components/EmergingNarrativesPrediction";
import MDMAlerts from "@/components/MDMAlerts";
import { NotificationCenter } from "@/components/NotificationCenter";
import { BrandPeopleList } from "@/components/BrandPeopleList";
import { DemoModeSelector } from "@/components/DemoModeSelector";
import { TrackedStories } from "@/components/TrackedStories";
import { DemoSocialMentions } from "@/components/DemoSocialMentions";
import { KeyPeopleSummary } from "@/components/KeyPeopleSummary";
import { DEMO_COMPANIES } from "@/lib/demoData";
import { analyzeSentiment, type AnalysisResult } from "@/lib/sentiment";
import { exportToPDF } from "@/lib/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { generateFallbackData } from "@/lib/fallbackData";
import html2canvas from "html2canvas";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


const Index = () => {
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [allMentions, setAllMentions] = useState<any[]>([]);
  const [sources, setSources] = useState<Array<{name: string; count: number; country?: string}>>([]);
  const [gdeltEntities, setGdeltEntities] = useState<{ name: string; count: number }[]>([]);
  const [gdeltLocations, setGdeltLocations] = useState<{ name: string; count: number; lat?: number; lon?: number }[]>([]);
  const [gdeltThemes, setGdeltThemes] = useState<{ name: string; count: number }[]>([]);
  const [mdmNarratives, setMdmNarratives] = useState<any[]>([]);
  const [mdmLoading, setMdmLoading] = useState(false);
  const [mdmAlerts, setMdmAlerts] = useState<any[]>([]);
  const [emergingPredictions, setEmergingPredictions] = useState<any[]>([]);
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [brandPeople, setBrandPeople] = useState<any[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [personMentions, setPersonMentions] = useState<Record<string, any>>({});
  const [personNarratives, setPersonNarratives] = useState<Record<string, any[]>>({});
  const [refreshingPersonId, setRefreshingPersonId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoCompany, setDemoCompany] = useState<string>("");
  const [trackedStories, setTrackedStories] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadDemoData = (companyName: string) => {
    const data = DEMO_COMPANIES[companyName];
    if (!data) return;

    // Clear previous results first
    setResults(null);
    setMdmNarratives([]);
    setEmergingPredictions([]);
    setMdmAlerts([]);
    setBrandPeople([]);
    setPersonMentions({});
    setPersonNarratives({});
    setTrackedStories([]);
    setTrendsData(null);
    setAllMentions([]);
    setSources([]);
    setGdeltEntities([]);
    setGdeltLocations([]);
    setGdeltThemes([]);

    setDemoMode(true);
    setDemoCompany(companyName);
    setBrandName(companyName);
    setLoading(true);

    // Map demo threat levels to AnalysisResult types
    const threatLevelMap: Record<string, "low" | "medium" | "high" | "critical"> = {
      low: "low",
      moderate: "medium",
      elevated: "medium",
      high: "high",
      critical: "critical"
    };

    // Simulate loading delay for realism
    setTimeout(() => {
      try {
        setResults({
          sentimentDistribution: data.sentimentDistribution.map(s => ({ ...s, fill: s.color })),
          shortTermSentiment: data.shortTermSentiment,
          longTermSentiment: data.longTermSentiment,
          trendIcon: data.trendIcon,
          previousSentiment: data.previousSentiment,
          keywords: data.keywords,
          timeline: data.timeline,
          threatLevel: threatLevelMap[data.threatLevel] || "medium",
          threatScore: data.threatScore,
        });
        setTrendsData(data.trendsData);
        setAllMentions(data.mentions || []);
        setSources(data.sources || []);
        setGdeltEntities(data.gdeltEntities || []);
        setGdeltLocations(data.gdeltLocations || []);
        setGdeltThemes(data.gdeltThemes || []);
        setMdmNarratives(data.mdmNarratives || []);
        setEmergingPredictions(data.emergingPredictions || []);
        setMdmAlerts(data.alerts || []);
        setBrandPeople((data.people || []).map(p => ({ ...p, discovered_at: new Date().toISOString() })));
        setPersonMentions(data.personMentions || {});
        setPersonNarratives(data.personNarratives || {});
        setTrackedStories(data.trackedStories || []);
        setLoading(false);

        toast({
          title: "Demo Mode Active",
          description: `Loaded intelligence data for ${companyName}`,
        });
      } catch (error) {
        console.error("Error loading demo data:", error);
        setLoading(false);
        toast({
          title: "Error",
          description: "Failed to load demo data",
          variant: "destructive",
        });
      }
    }, 1500);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);

      // Grant access to any brand the user searches
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Automatically grant brand access when user searches
        setUserId(user.id);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const fetchMDMAlerts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("mdm_alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching MDM alerts:", error);
    } else {
      setMdmAlerts(data || []);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchMDMAlerts();
    }
  }, [userId]);

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

      // Fetch all data sources in parallel (non-blocking)
      const [newsData, redditData, trends, hnData, mastodonData, wikiData, rssAggregatorData, gdeltDocData, gdeltGkgData, googleNewsData, blueskyData, lobstersData, devtoData] = await Promise.allSettled([
        supabase.functions.invoke("fetch-news", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-reddit", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-trends", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-hackernews", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-mastodon", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-wikipedia", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-rss-aggregator", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-gdelt-doc", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-gdelt-gkg", { body: { brand: brandName } }),
        // New free sources (no API keys required)
        supabase.functions.invoke("fetch-googlenews-rss", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-bluesky", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-lobsters", { body: { brand: brandName } }),
        supabase.functions.invoke("fetch-devto", { body: { brand: brandName } }),
      ]);

      // Process news data
      let articles = [];
      if (newsData.status === "fulfilled" && !newsData.value.error) {
        articles = newsData.value.data?.articles || [];
      } else {
        console.warn("News API unavailable:", newsData.status === "fulfilled" ? newsData.value.error : newsData.reason);
      }

      // Process Reddit data
      let redditPosts = [];
      if (redditData.status === "fulfilled" && !redditData.value.error) {
        redditPosts = redditData.value.data?.posts || [];
      } else {
        console.warn("Reddit API unavailable:", redditData.status === "fulfilled" ? redditData.value.error : redditData.reason);
      }

      // Process Google Trends data
      if (trends.status === "fulfilled" && !trends.value.error) {
        setTrendsData(trends.value.data);
      } else {
        console.warn("Trends API unavailable:", trends.status === "fulfilled" ? trends.value.error : trends.reason);
        setTrendsData(null);
      }

      // Process Hacker News data
      let hnPosts = [];
      if (hnData.status === "fulfilled" && !hnData.value.error) {
        hnPosts = hnData.value.data?.posts || [];
      } else {
        console.warn("Hacker News API unavailable:", hnData.status === "fulfilled" ? hnData.value.error : hnData.reason);
      }

      // Process Mastodon data
      let mastodonPosts = [];
      if (mastodonData.status === "fulfilled" && !mastodonData.value.error) {
        mastodonPosts = mastodonData.value.data?.posts || [];
      } else {
        console.warn("Mastodon API unavailable:", mastodonData.status === "fulfilled" ? mastodonData.value.error : mastodonData.reason);
      }

      // Process Wikipedia data
      let wikiArticles = [];
      if (wikiData.status === "fulfilled" && !wikiData.value.error) {
        wikiArticles = wikiData.value.data?.articles || [];
      } else {
        console.warn("Wikipedia API unavailable:", wikiData.status === "fulfilled" ? wikiData.value.error : wikiData.reason);
      }

      // Process RSS Aggregator data (50+ news sources)
      let rssArticles = [];
      if (rssAggregatorData.status === "fulfilled" && !rssAggregatorData.value.error) {
        rssArticles = rssAggregatorData.value.data?.articles || [];
        console.log(`RSS Aggregator: ${rssAggregatorData.value.data?.activeSources || 0} active sources`);
      } else {
        console.warn("RSS Aggregator unavailable:", rssAggregatorData.status === "fulfilled" ? rssAggregatorData.value.error : rssAggregatorData.reason);
      }

      // Process GDELT DOC data (global news articles)
      let gdeltArticles = [];
      if (gdeltDocData.status === "fulfilled" && !gdeltDocData.value.error) {
        gdeltArticles = gdeltDocData.value.data?.articles || [];
        console.log(`GDELT DOC: ${gdeltArticles.length} global articles`);
      } else {
        console.warn("GDELT DOC unavailable:", gdeltDocData.status === "fulfilled" ? gdeltDocData.value.error : gdeltDocData.reason);
      }

      // Process GDELT GKG data (entities, themes, locations)
      if (gdeltGkgData.status === "fulfilled" && !gdeltGkgData.value.error) {
        const gkgData = gdeltGkgData.value.data;
        setGdeltEntities(gkgData?.entities || []);
        setGdeltLocations(gkgData?.locations || []);
        setGdeltThemes(gkgData?.themes || []);
        console.log(`GDELT GKG: ${gkgData?.entities?.length || 0} entities, ${gkgData?.themes?.length || 0} themes, ${gkgData?.locations?.length || 0} locations`);
      } else {
        console.warn("GDELT GKG unavailable:", gdeltGkgData.status === "fulfilled" ? gdeltGkgData.value.error : gdeltGkgData.reason);
        setGdeltEntities([]);
        setGdeltLocations([]);
        setGdeltThemes([]);
      }

      // Process Google News RSS data (free, no API key)
      let googleNewsArticles = [];
      if (googleNewsData.status === "fulfilled" && !googleNewsData.value.error) {
        googleNewsArticles = googleNewsData.value.data?.articles || [];
        console.log(`Google News RSS: ${googleNewsArticles.length} articles`);
      } else {
        console.warn("Google News RSS unavailable:", googleNewsData.status === "fulfilled" ? googleNewsData.value.error : googleNewsData.reason);
      }

      // Process Bluesky data (free, no API key)
      let blueskyPosts = [];
      if (blueskyData.status === "fulfilled" && !blueskyData.value.error) {
        blueskyPosts = blueskyData.value.data?.posts || [];
        console.log(`Bluesky: ${blueskyPosts.length} posts`);
      } else {
        console.warn("Bluesky unavailable:", blueskyData.status === "fulfilled" ? blueskyData.value.error : blueskyData.reason);
      }

      // Process Lobsters data (free, no API key)
      let lobstersPosts = [];
      if (lobstersData.status === "fulfilled" && !lobstersData.value.error) {
        lobstersPosts = lobstersData.value.data?.posts || [];
        console.log(`Lobsters: ${lobstersPosts.length} posts`);
      } else {
        console.warn("Lobsters unavailable:", lobstersData.status === "fulfilled" ? lobstersData.value.error : lobstersData.reason);
      }

      // Process Dev.to data (free, no API key)
      let devtoArticles = [];
      if (devtoData.status === "fulfilled" && !devtoData.value.error) {
        devtoArticles = devtoData.value.data?.articles || [];
        console.log(`Dev.to: ${devtoArticles.length} articles`);
      } else {
        console.warn("Dev.to unavailable:", devtoData.status === "fulfilled" ? devtoData.value.error : devtoData.reason);
      }

      // Combine and analyze data from ALL sources
      const mentions = [
        ...articles.map((a: any) => ({
          text: `${a.title} ${a.description || ''}`,
          source: "NewsAPI",
          date: new Date(a.publishedAt),
        })),
        ...redditPosts.map((p: any) => ({
          text: `${p.title} ${p.selftext || ''}`,
          source: "Reddit",
          date: new Date(p.created_utc * 1000),
          score: p.score,
        })),
        ...hnPosts.map((p: any) => ({
          text: p.text || p.title,
          source: "Hacker News",
          date: new Date(p.created),
          score: p.score,
        })),
        ...mastodonPosts.map((p: any) => ({
          text: p.text,
          source: "Mastodon",
          date: new Date(p.created),
          score: p.score,
        })),
        ...wikiArticles.map((a: any) => ({
          text: `${a.title}: ${a.snippet}`,
          source: "Wikipedia",
          date: new Date(a.timestamp),
        })),
        ...rssArticles.map((a: any) => ({
          text: `${a.title} ${a.text || ''}`,
          source: a.source, // Will be source name like "BBC News", "CNN", etc.
          country: a.country,
          date: new Date(a.publishedAt),
        })),
        ...gdeltArticles.map((a: any) => ({
          text: a.title || a.text,
          source: `GDELT (${a.country})`,
          country: a.country,
          date: new Date(a.publishedAt),
        })),
        // New free sources
        ...googleNewsArticles.map((a: any) => ({
          text: a.title || a.text,
          source: `Google News (${a.source || 'News'})`,
          date: new Date(a.publishedAt),
        })),
        ...blueskyPosts.map((p: any) => ({
          text: p.text,
          source: "Bluesky",
          date: new Date(p.created),
          author: p.displayName || p.author,
          score: (p.likes || 0) + (p.reposts || 0),
        })),
        ...lobstersPosts.map((p: any) => ({
          text: p.title || p.text,
          source: "Lobsters",
          date: new Date(p.created),
          score: p.score,
        })),
        ...devtoArticles.map((a: any) => ({
          text: `${a.title} ${a.text || ''}`,
          source: "Dev.to",
          date: new Date(a.created),
          score: a.reactions,
        })),
      ];

      // Calculate source statistics
      const sourceStats = mentions.reduce((acc: any, mention: any) => {
        const sourceName = mention.source;
        if (!acc[sourceName]) {
          acc[sourceName] = { 
            name: sourceName, 
            count: 0,
            country: mention.country
          };
        }
        acc[sourceName].count++;
        return acc;
      }, {});
      
      setSources(Object.values(sourceStats));

      // Check if we should use fallback data (all APIs failed)
      let useFallback = false;
      let fallbackData = null;
      
      if (mentions.length === 0) {
        console.log("All APIs failed or returned no data - using fallback demo data");
        useFallback = true;
        fallbackData = generateFallbackData(brandName);
        
        toast({
          title: "Using demo data",
          description: "APIs unavailable - showing sample intelligence data",
        });
      }

      // Use either real data or fallback
      const finalMentions = useFallback && fallbackData ? fallbackData.mentions : mentions;
      setAllMentions(finalMentions);
      
      if (useFallback && fallbackData) {
        // Set fallback data for all dashboard components
        setTrendsData(fallbackData.trendsData);
        setSources(fallbackData.sources);
        setGdeltEntities(fallbackData.gdeltEntities);
        setGdeltLocations(fallbackData.gdeltLocations);
        setGdeltThemes(fallbackData.gdeltThemes);
      }
      
      if (!userId) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Grant brand access to user
      const { error: accessError } = await supabase.from("user_brand_access").upsert({
        user_id: userId,
        brand_name: brandName,
      }, { onConflict: 'user_id,brand_name' });

      // Use fallback analysis or run real sentiment analysis
      let analysis: AnalysisResult;
      if (useFallback && fallbackData) {
        analysis = fallbackData.analysis;
      } else {
        analysis = await analyzeSentiment(finalMentions, brandName, userId);
      }
      setResults(analysis);

      // Get fresh session for authorization (used by multiple edge function calls)
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        throw new Error("No active session");
      }

      // Analyze MDM narratives using AI (skip if using fallback data)
      setMdmLoading(true);
      let mdmResults: any[] = [];
      
      if (useFallback && fallbackData) {
        // Use fallback MDM data
        setMdmNarratives(fallbackData.mdmNarratives);
        setEmergingPredictions(fallbackData.emergingPredictions);
        mdmResults = fallbackData.mdmNarratives;
        setMdmLoading(false);
      } else {
        try {
          const { data: mdmData, error: mdmError } = await supabase.functions.invoke("analyze-mdm-narratives", {
            body: { brand: brandName, mentions },
            headers: {
              Authorization: `Bearer ${currentSession.access_token}`
            }
          });
          
          if (!mdmError && mdmData?.narratives) {
            setMdmNarratives(mdmData.narratives);
            mdmResults = mdmData.narratives;
            
            // Handle alerts
            if (mdmData.alerts && mdmData.alerts.length > 0) {
              setMdmAlerts(mdmData.alerts);
              toast({
                title: `${mdmData.alerts.length} MDM Alert${mdmData.alerts.length > 1 ? 's' : ''}`,
                description: "New or surging narratives detected",
                variant: "destructive",
              });
            }
          } else {
            console.warn("MDM analysis failed:", mdmError);
            setMdmNarratives([]);
          }
        } catch (mdmErr) {
          console.error("MDM analysis error:", mdmErr);
          setMdmNarratives([]);
        } finally {
          setMdmLoading(false);
        }
      }
      
      // Fetch existing alerts for this brand (all, not just unread)
      try {
        const { data: existingAlerts } = await supabase
          .from('mdm_alerts')
          .select('*')
          .eq('brand_name', brandName)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (existingAlerts && existingAlerts.length > 0) {
          setMdmAlerts(prev => [...existingAlerts, ...prev]);
        }
      } catch (err) {
        console.error("Error fetching existing alerts:", err);
      }

      // Analyze emerging narratives using AI (skip if using fallback - already set above)
      if (!useFallback) {
        setPredictionsLoading(true);
        try {
          const { data: predData, error: predError } = await supabase.functions.invoke("analyze-emerging-narratives", {
            body: { brand: brandName, mentions, mdmNarratives: mdmResults },
            headers: {
              Authorization: `Bearer ${currentSession.access_token}`
            }
          });
          
          if (!predError && predData?.predictions) {
            setEmergingPredictions(predData.predictions);
          } else {
            console.warn("Emerging narratives analysis failed:", predError);
            setEmergingPredictions([]);
          }
        } catch (predErr) {
          console.error("Emerging narratives error:", predErr);
          setEmergingPredictions([]);
        } finally {
          setPredictionsLoading(false);
        }
      }

      // Cache results (skip caching fallback data)
      if (!useFallback) {
        localStorage.setItem(cacheKey, JSON.stringify(analysis));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      }

      toast({
        title: useFallback ? "Demo data loaded" : "Analysis complete",
        description: useFallback 
          ? `Showing sample data for "${brandName}" (APIs unavailable)`
          : `Found ${finalMentions.length} mentions`,
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
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200,
        windowHeight: element.scrollHeight,
      });
      const link = document.createElement("a");
      link.download = `${brandName}_narrative_snapshot.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
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

  const handlePDFExport = async () => {
    if (!results) return;

    try {
      await exportToPDF({
        brandName,
        threatLevel: results.threatLevel,
        threatScore: results.threatScore,
        sentimentDistribution: results.sentimentDistribution,
        keywords: results.keywords,
        sources,
        mdmNarratives,
        emergingPredictions,
        people: brandPeople,
        personMentions,
        personNarratives,
        totalMentions: allMentions.length,
        shortTermSentiment: results.shortTermSentiment,
        longTermSentiment: results.longTermSentiment,
        timeline: results.timeline || [],
        gdeltEntities,
        gdeltLocations,
        gdeltThemes
      });

      toast({
        title: "PDF Report downloaded",
        description: "Full report exported successfully",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF report",
        variant: "destructive",
      });
    }
  };

  const handleDiscoverPeople = async () => {
    if (!brandName || !userId) return;
    
    setPeopleLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("No active session");
      
      const { data, error } = await supabase.functions.invoke("discover-brand-people", {
        body: { brandName },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (error) throw error;

      if (data?.people) {
        setBrandPeople(data.people);
        toast({
          title: "People Discovered",
          description: `Found ${data.count} key people associated with ${brandName}`,
        });

        // Fetch data for each discovered person
        for (const person of data.people) {
          await handleRefreshPersonData(person.id, person.person_name, false);
        }
      }
    } catch (error: any) {
      console.error("Error discovering people:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to discover people",
        variant: "destructive",
      });
    } finally {
      setPeopleLoading(false);
    }
  };

  const handleRefreshPersonData = async (personId: string, personName?: string, showToast = true) => {
    if (!brandName || !userId) return;
    
    setRefreshingPersonId(personId);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("No active session");
      
      const person = brandPeople.find(p => p.id === personId);
      const name = personName || person?.person_name;
      
      const { data, error } = await supabase.functions.invoke("analyze-person-data", {
        body: { 
          personId,
          brandName,
          personName: name
        },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (error) throw error;

      if (data?.analysis) {
        setPersonMentions(prev => ({
          ...prev,
          [personId]: {
            mention_count: data.analysis.mentions,
            sentiment_score: data.analysis.sentiment_score,
            positive_count: data.analysis.positive,
            negative_count: data.analysis.negative,
            neutral_count: data.analysis.neutral,
          }
        }));

        // Fetch MDM narratives for this person
        const { data: narrativesData } = await supabase
          .from('person_mdm_narratives')
          .select('*')
          .eq('person_id', personId)
          .order('created_at', { ascending: false });
          
        if (narrativesData) {
          setPersonNarratives(prev => ({
            ...prev,
            [personId]: narrativesData
          }));
        }

        if (showToast) {
          toast({
            title: "Data Updated",
            description: `Refreshed data for ${name}`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error refreshing person data:", error);
      if (showToast) {
        toast({
          title: "Error",
          description: error.message || "Failed to refresh person data",
          variant: "destructive",
        });
      }
    } finally {
      setRefreshingPersonId(null);
    }
  };

  useEffect(() => {
    // Fetch discovered people when results are loaded
    if (results && brandName && userId) {
      const fetchPeople = async () => {
        const { data } = await supabase
          .from('brand_people')
          .select('*')
          .eq('brand_name', brandName)
          .eq('user_id', userId)
          .order('discovered_at', { ascending: false });
          
        if (data) {
          setBrandPeople(data);
          
          // Fetch mentions and narratives for each person
          for (const person of data) {
            const { data: mentionsData } = await supabase
              .from('person_mentions_history')
              .select('*')
              .eq('person_id', person.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
              
            if (mentionsData) {
              setPersonMentions(prev => ({ ...prev, [person.id]: mentionsData }));
            }
            
            const { data: narrativesData } = await supabase
              .from('person_mdm_narratives')
              .select('*')
              .eq('person_id', person.id)
              .order('created_at', { ascending: false });
              
            if (narrativesData) {
              setPersonNarratives(prev => ({ ...prev, [person.id]: narrativesData }));
            }
          }
        }
      };
      
      fetchPeople();
    }
  }, [results, brandName, userId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center flex-shrink-0">
                <img src={greyguardsLogo} alt="Greyguards" className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                  Greyguards – Greyscan
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">
                  Narrative Intelligence Scanner
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <DemoModeSelector 
                onSelectCompany={loadDemoData}
                isActive={demoMode}
                currentCompany={demoCompany}
              />
              <NotificationCenter alerts={mdmAlerts} onAlertsUpdate={fetchMDMAlerts} />
              <Link to="/redteam">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Target className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Red Team</span>
                  <span className="sm:hidden">RT</span>
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="sm:hidden h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <Card className="border border-border bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter brand or organization..."
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-10 sm:h-11"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="w-full sm:w-auto h-10 sm:h-11">
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
              <div className="mt-4 flex justify-end gap-2">
                <Button onClick={handleDownload} variant="outline" size="sm" className="uppercase tracking-wider">
                  <Download className="mr-2 h-4 w-4" />
                  Export PNG
                </Button>
                <Button 
                  onClick={handlePDFExport} 
                  variant="outline" 
                  size="sm" 
                  className="uppercase tracking-wider"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Overview */}
        {/* Results Dashboard */}
        {results && (
          <div id="dashboard" className="mt-8 space-y-6">
            <Tabs defaultValue="brand" className="w-full">
              <TabsList className={`grid w-full max-w-md mx-auto mb-6 ${demoMode ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <TabsTrigger value="brand" className="uppercase tracking-wider">
                  Brand Overview
                </TabsTrigger>
                {demoMode && (
                  <TabsTrigger value="people" className="uppercase tracking-wider">
                    <Users className="h-4 w-4 mr-2" />
                    Key People
                  </TabsTrigger>
                )}</TabsList>

              <TabsContent value="brand" className="space-y-6">
                {/* Threat Indicator */}
                <ThreatIndicator
                  threatLevel={results.threatLevel}
                  threatScore={results.threatScore}
                />

                {/* Sentiment Analysis & Trend */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SentimentTrendComparison
                    shortTermSentiment={results.shortTermSentiment}
                    longTermSentiment={results.longTermSentiment}
                    trendIcon={results.trendIcon}
                    previousSentiment={results.previousSentiment}
                  />
                  <SentimentChart data={results.sentimentDistribution} />
                </div>

                {/* MDM Alerts - Only show unread */}
                {mdmAlerts.filter(a => !a.is_read).length > 0 && (
                  <MDMAlerts 
                    alerts={mdmAlerts.filter(a => !a.is_read)}
                    onDismiss={fetchMDMAlerts}
                    onMarkAllRead={fetchMDMAlerts}
                  />
                )}

                {/* MDM Narrative Intelligence */}
                <MDMNarrativesTracker 
                  narratives={mdmNarratives}
                  loading={mdmLoading}
                />

                {/* Emerging Narrative Predictions */}
                <EmergingNarrativesPrediction
                  predictions={emergingPredictions}
                  isLoading={predictionsLoading}
                />

                {/* Demo Mode: Tracked Stories */}
                {demoMode && trackedStories.length > 0 && (
                  <TrackedStories stories={trackedStories} brandName={brandName} />
                )}

                {/* Demo Mode: Social Intelligence Feed */}
                {demoMode && allMentions.length > 0 && (
                  <DemoSocialMentions mentions={allMentions} brandName={brandName} />
                )}

                {/* Timeline & Keywords */}
                <TimelineChart data={results.timeline} />
                <KeywordsChart data={results.keywords} />

                {/* GDELT Global Intelligence */}
                {gdeltThemes.length > 0 && (
                  <GDELTThemesChart data={gdeltThemes} />
                )}
                
                {(gdeltEntities.length > 0 || gdeltLocations.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {gdeltEntities.length > 0 && (
                      <GDELTEntitiesChart data={gdeltEntities} />
                    )}
                    {gdeltLocations.length > 0 && (
                      <GDELTLocationsMap locations={gdeltLocations} />
                    )}
                  </div>
                )}

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
                        currentNegative={results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0}
                        previousNegative={results.previousSentiment < 0 
                          ? Math.abs(Math.round(results.previousSentiment * allMentions.length / 100))
                          : Math.round((results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0) * 0.9)
                        }
                        totalMentions={allMentions.length}
                        negativeBySource={(() => {
                          const negativeMentions = allMentions.filter((_, idx) => {
                            const negativeDist = results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0;
                            return idx < negativeDist;
                          });
                          const sourceCount = negativeMentions.reduce((acc: any, mention: any) => {
                            const source = mention.source || 'unknown';
                            acc[source] = (acc[source] || 0) + 1;
                            return acc;
                          }, {});
                          const totalNegative = results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0;
                          return Object.entries(sourceCount).map(([source, count]) => ({
                            source,
                            count: count as number,
                            percentage: ((count as number) / totalNegative) * 100
                          }));
                        })()}
                        changeVelocity={(() => {
                          const negativeCurrent = results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0;
                          const negativePrevious = results.previousSentiment < 0 
                            ? Math.abs(Math.round(results.previousSentiment * allMentions.length / 100))
                            : Math.round(negativeCurrent * 0.9);
                          return (negativeCurrent - negativePrevious) / 7; // Average per day over 7 days
                        })()}
                        peakNegativeDay={results.timeline.reduce((max, item) => 
                          item.mentions > max.mentions ? item : max, 
                          results.timeline[0]
                        )?.date}
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

                {/* AI Strategic Recommendations */}
                <StrategicRecommendations
                  brandName={brandName}
                  topTopics={results.keywords.slice(0, 5).map(k => k.word).join(", ")}
                  sentimentSummary={`Positive: ${Math.round((results.sentimentDistribution.find(s => s.name === "Positive")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100)}%, Negative: ${Math.round((results.sentimentDistribution.find(s => s.name === "Negative")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100)}%, Neutral: ${Math.round((results.sentimentDistribution.find(s => s.name === "Neutral")?.value || 0) / (results.sentimentDistribution.reduce((sum, s) => sum + s.value, 0)) * 100)}%`}
                  riskLevel={results.threatLevel}
                />

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

                {/* Sources Table */}
                <SourcesTable sources={sources} />

                {/* Demo Mode: Key People Summary for Report */}
                {demoMode && brandPeople.length > 0 && (
                  <KeyPeopleSummary
                    people={brandPeople}
                    mentions={personMentions}
                    narratives={personNarratives}
                  />
                )}
              </TabsContent>

              {demoMode && (
                <TabsContent value="people" className="space-y-6">
                  <Card className="border-4 border-border bg-card">
                    <CardHeader className="border-b-4 border-border">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
                          <Users className="h-5 w-5" />
                          Key People Intelligence
                        </CardTitle>
                        <Button
                          onClick={handleDiscoverPeople}
                          disabled={peopleLoading}
                          className="uppercase tracking-wider"
                        >
                          {peopleLoading ? (
                            <>
                              <span className="animate-spin mr-2">⟳</span>
                              Discovering...
                            </>
                          ) : (
                            'Discover Key People'
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <BrandPeopleList
                        people={brandPeople}
                        mentions={personMentions}
                        narratives={personNarratives}
                        onRefresh={handleRefreshPersonData}
                        isRefreshing={refreshingPersonId}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

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
                  Data sources: 50+ Global News Outlets + GDELT (Global Database) + Reddit + Hacker News + Mastodon + Wikipedia // Sentiment analysis: AI-powered models
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
                  The Greyguards system combines AI analysis with human strategic communications expertise.
                  Book a <strong className="text-foreground">Grey Zone Consultation</strong> to develop your organisation's misinformation defence strategy.
                </p>
                <a
                  href={`mailto:grant@thelondon.team?subject=Greyguards Consultation for ${brandName}`}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-sm font-semibold uppercase tracking-wider transition-colors hover:bg-[hsl(0,0%,62%)] no-underline"
                >
                  <Send className="h-5 w-5" />
                  Book a Consultation
                </a>
                <p className="text-xs text-muted-foreground mt-6 uppercase tracking-wider">
                  Greyguards – AI-powered narrative intelligence for the grey zone.
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
