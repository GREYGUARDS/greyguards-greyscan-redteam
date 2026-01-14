import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  Newspaper,
  Users,
  Radio,
  Shield,
  Target,
  ChevronRight,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Volume2,
  ArrowLeft,
  Send,
  PenLine
} from "lucide-react";
import { ExerciseConfig, Scenario, Inject, ResponseOption, TeamScore, ResponseRecord } from "@/pages/RedTeam";
import CountdownTimer from "./CountdownTimer";
import { supabase } from "@/integrations/supabase/client";

interface ExercisePlayerProps {
  config: ExerciseConfig;
  scenario: Scenario;
  onComplete: (
    score: TeamScore, 
    responseHistory: ResponseRecord[], 
    eventLog: Array<{ time: number; message: string; type: string }>
  ) => void;
  onBack: () => void;
}

const ExercisePlayer = ({ config, scenario, onComplete, onBack }: ExercisePlayerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [activeInject, setActiveInject] = useState<Inject | null>(null);
  const [narrativeControl, setNarrativeControl] = useState(50);
  const [reputationDamage, setReputationDamage] = useState(20);
  const [decisionsCorrect, setDecisionsCorrect] = useState(0);
  const [decisionsTotal, setDecisionsTotal] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [injectStartTime, setInjectStartTime] = useState<number | null>(null);
  const [eventLog, setEventLog] = useState<Array<{ time: number; message: string; type: "inject" | "response" | "system" }>>([]);
  const [responseHistory, setResponseHistory] = useState<ResponseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customCountermeasure, setCustomCountermeasure] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const nextInjectTimeRef = useRef<number>(15); // First inject after 15 seconds
  const injectCountRef = useRef<number>(0);
  const lastResponseTimeRef = useRef<number | null>(null);
  const totalDuration = config.duration * 60;

  // Generate pre-defined injects based on scenario
  const generateInjects = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-redteam-injects', {
        body: {
          scenario,
          brandName: config.brandName,
          duration: config.duration
        }
      });

      if (error) throw error;
      return data.injects as Inject[];
    } catch (error) {
      console.error("Error generating injects:", error);
      // Return fallback injects
      return generateFallbackInjects();
    }
  }, [scenario, config]);

  const generateFallbackInjects = (): Inject[] => {
    const baseInjects: Inject[] = [
      {
        id: "1",
        timestamp: 15,
        type: "social_post",
        content: `BREAKING: Anonymous source claims ${config.brandName} has been covering up major scandal. Thread incoming... 🧵`,
        source: "@TruthSeeker_Anon (47K followers)",
        reach: 47000,
        sentiment: "hostile",
        requiresResponse: true,
        isAggressive: true,
        responseOptions: [
          { id: "1a", label: "Issue denial statement", description: "Quickly deny the allegations publicly", type: "statement", effectiveness: 60, riskLevel: "medium", timeToExecute: 30 },
          { id: "1b", label: "Monitor & gather intel", description: "Watch the situation develop before responding", type: "internal_action", effectiveness: 70, riskLevel: "low", timeToExecute: 60 },
          { id: "1c", label: "Engage Greyguards", description: "Contact crisis management team for guidance", type: "greyguards_service", effectiveness: 85, riskLevel: "low", timeToExecute: 45 }
        ]
      },
      {
        id: "2",
        timestamp: 45,
        type: "news_article",
        content: `Mid-tier news site picks up the story: "Social Media Buzzes with Unverified Claims About ${config.brandName}"`,
        source: "DailyBuzz.net",
        reach: 120000,
        sentiment: "confused",
        requiresResponse: true,
        responseOptions: [
          { id: "2a", label: "Contact editor", description: "Reach out to request correction or context", type: "media_outreach", effectiveness: 75, riskLevel: "low", timeToExecute: 90 },
          { id: "2b", label: "Public rebuttal", description: "Issue a detailed factual rebuttal", type: "statement", effectiveness: 65, riskLevel: "medium", timeToExecute: 60 },
          { id: "2c", label: "Prepare legal notice", description: "Have legal team prepare cease and desist", type: "legal", effectiveness: 55, riskLevel: "high", timeToExecute: 120 }
        ]
      },
      {
        id: "3",
        timestamp: 90,
        type: "influencer",
        content: `Major tech influencer shares: "Hearing some wild things about ${config.brandName}. Anyone have more info?" - This dramatically increases visibility.`,
        source: "@TechInsider (890K followers)",
        reach: 890000,
        sentiment: "confused",
        requiresResponse: true,
        isAggressive: false,
        responseOptions: [
          { id: "3a", label: "DM the influencer", description: "Privately reach out with facts", type: "social_response", effectiveness: 80, riskLevel: "low", timeToExecute: 30 },
          { id: "3b", label: "Public reply", description: "Respond publicly with clarification", type: "social_response", effectiveness: 60, riskLevel: "medium", timeToExecute: 15 },
          { id: "3c", label: "Ignore", description: "Don't engage and hope it dies down", type: "internal_action", effectiveness: 30, riskLevel: "high", timeToExecute: 0 }
        ]
      },
      {
        id: "4",
        timestamp: 150,
        type: "amplification",
        content: `Coordinated amplification detected! 50+ accounts simultaneously sharing the allegations with identical messaging. Bot behavior suspected.`,
        source: "Multiple bot accounts",
        reach: 500000,
        sentiment: "hostile",
        requiresResponse: true,
        isAggressive: true,
        responseOptions: [
          { id: "4a", label: "Report to platforms", description: "Mass report the coordinated accounts", type: "internal_action", effectiveness: 70, riskLevel: "low", timeToExecute: 45 },
          { id: "4b", label: "Public transparency", description: "Highlight the coordinated attack publicly", type: "statement", effectiveness: 75, riskLevel: "medium", timeToExecute: 60 },
          { id: "4c", label: "Greyguards investigation", description: "Commission attribution investigation", type: "greyguards_service", effectiveness: 90, riskLevel: "low", timeToExecute: 30 }
        ]
      },
      {
        id: "5",
        timestamp: 240,
        type: "leak",
        content: `Fake "leaked" internal document surfaces claiming to show ${config.brandName} executives discussing the coverup. Document has obvious signs of fabrication.`,
        source: "Anonymous paste site",
        reach: 250000,
        sentiment: "hostile",
        requiresResponse: true,
        isAggressive: true,
        responseOptions: [
          { id: "5a", label: "Forensic debunk", description: "Publish detailed analysis proving the forgery", type: "statement", effectiveness: 85, riskLevel: "low", timeToExecute: 120 },
          { id: "5b", label: "Legal action", description: "Pursue legal action against distributors", type: "legal", effectiveness: 60, riskLevel: "high", timeToExecute: 180 },
          { id: "5c", label: "CEO statement", description: "Have CEO directly address and deny", type: "statement", effectiveness: 70, riskLevel: "medium", timeToExecute: 90 }
        ]
      },
      {
        id: "6",
        timestamp: 360,
        type: "news_article",
        content: `Major outlet publishes: "${config.brandName} Faces Online Campaign - Company Calls It Coordinated Disinformation"`,
        source: "Reuters",
        reach: 2000000,
        sentiment: "neutral",
        requiresResponse: true,
        responseOptions: [
          { id: "6a", label: "Provide full briefing", description: "Give Reuters exclusive background briefing", type: "media_outreach", effectiveness: 85, riskLevel: "low", timeToExecute: 60 },
          { id: "6b", label: "Thank publicly", description: "Thank outlet for balanced reporting", type: "social_response", effectiveness: 70, riskLevel: "low", timeToExecute: 15 },
          { id: "6c", label: "No comment", description: "Let the story speak for itself", type: "internal_action", effectiveness: 50, riskLevel: "medium", timeToExecute: 0 }
        ]
      },
      {
        id: "7",
        timestamp: 480,
        type: "official_response",
        content: `Competitor's marketing account posts thinly-veiled reference: "At [Competitor], we believe in transparency. Always." - Seems opportunistic.`,
        source: "@CompetitorOfficial (250K followers)",
        reach: 250000,
        sentiment: "hostile",
        requiresResponse: true,
        isAggressive: false,
        responseOptions: [
          { id: "7a", label: "Ignore competitor", description: "Don't give them the attention they want", type: "internal_action", effectiveness: 75, riskLevel: "low", timeToExecute: 0 },
          { id: "7b", label: "Respond with grace", description: "Reply with measured professionalism", type: "social_response", effectiveness: 65, riskLevel: "medium", timeToExecute: 30 },
          { id: "7c", label: "Flag to legal", description: "Have legal assess if actionable", type: "legal", effectiveness: 40, riskLevel: "low", timeToExecute: 60 }
        ]
      },
      {
        id: "8",
        timestamp: 600,
        type: "social_post",
        content: `The original anonymous account admits: "Okay I may have exaggerated some things but I stand by the core claims!" - Narrative is weakening.`,
        source: "@TruthSeeker_Anon",
        reach: 47000,
        sentiment: "confused",
        requiresResponse: true,
        responseOptions: [
          { id: "8a", label: "Amplify admission", description: "Highlight the admission widely", type: "social_response", effectiveness: 90, riskLevel: "low", timeToExecute: 15 },
          { id: "8b", label: "Demand full retraction", description: "Push for complete retraction", type: "statement", effectiveness: 70, riskLevel: "medium", timeToExecute: 45 },
          { id: "8c", label: "Continue monitoring", description: "Don't pile on, keep watching", type: "internal_action", effectiveness: 60, riskLevel: "low", timeToExecute: 0 }
        ]
      }
    ];

    // Filter based on duration
    return baseInjects.filter(inject => inject.timestamp <= config.duration * 60 - 60);
  };

  // Initialize injects
  useEffect(() => {
    const loadInjects = async () => {
      setIsLoading(true);
      const generatedInjects = await generateInjects();
      setInjects(generatedInjects);
      setIsLoading(false);
    };
    loadInjects();
  }, [generateInjects]);

  // Timer effect with improved inject reactivity
  useEffect(() => {
    if (isPaused || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          clearInterval(interval);
          handleExerciseComplete();
          return 0;
        }

        // Check for timed injects - accelerated if we just responded
        const elapsedTime = totalDuration - newTime;
        const timeSinceLastResponse = lastResponseTimeRef.current 
          ? elapsedTime - lastResponseTimeRef.current 
          : null;
        
        // If we responded recently (within 3-8 seconds), trigger next inject immediately
        const shouldAccelerate = timeSinceLastResponse !== null && 
                                  timeSinceLastResponse >= 3 && 
                                  timeSinceLastResponse <= 8;
        
        // Find the next untriggered inject
        const triggeredSources = eventLog.filter(e => e.type === "inject").map(e => e.message);
        const nextInject = injects.find((inject) => {
          const notYetTriggered = !triggeredSources.some(msg => msg.includes(inject.source));
          if (!notYetTriggered) return false;
          
          if (shouldAccelerate) {
            // Immediately trigger next available inject after a response
            return true;
          }
          
          // Normal timing check
          return inject.timestamp <= elapsedTime && inject.timestamp > elapsedTime - 2;
        });

        if (nextInject && !activeInject) {
          triggerInject(nextInject);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, injects, activeInject, eventLog, totalDuration]);

  const triggerInject = (inject: Inject) => {
    setActiveInject(inject);
    setInjectStartTime(Date.now());
    setEventLog((prev) => [
      {
        time: totalDuration - timeRemaining,
        message: `[${inject.type.toUpperCase()}] ${inject.source}: "${inject.content.substring(0, 60)}..."`,
        type: "inject"
      },
      ...prev
    ]);

    // Update metrics based on inject
    if (inject.isAggressive) {
      setReputationDamage((prev) => Math.min(100, prev + 5));
      setNarrativeControl((prev) => Math.max(0, prev - 5));
    }
  };

  const handleResponse = (option: ResponseOption) => {
    if (!activeInject || !injectStartTime) return;

    const responseTime = (Date.now() - injectStartTime) / 1000;
    const wasCorrect = option.effectiveness >= 65;
    
    setResponseTimes((prev) => [...prev, responseTime]);
    setDecisionsTotal((prev) => prev + 1);

    // Record response for debrief
    const record: ResponseRecord = {
      injectId: activeInject.id,
      injectType: activeInject.type,
      injectContent: activeInject.content,
      responseLabel: option.label,
      responseType: option.type,
      effectiveness: option.effectiveness,
      responseTime,
      wasCorrect,
      timestamp: totalDuration - timeRemaining
    };
    setResponseHistory((prev) => [...prev, record]);

    // Calculate if decision was correct (effectiveness > 65 = correct)
    if (wasCorrect) {
      setDecisionsCorrect((prev) => prev + 1);
      setNarrativeControl((prev) => Math.min(100, prev + (option.effectiveness / 10)));
      setReputationDamage((prev) => Math.max(0, prev - (option.effectiveness / 15)));
    } else {
      setNarrativeControl((prev) => Math.max(0, prev - 5));
      if (option.riskLevel === "high") {
        setReputationDamage((prev) => Math.min(100, prev + 10));
      }
    }

    setEventLog((prev) => [
      {
        time: totalDuration - timeRemaining,
        message: `Response: ${option.label} (${option.effectiveness}% effective)`,
        type: "response"
      },
      ...prev
    ]);

    // Track when we responded for accelerated next inject
    lastResponseTimeRef.current = totalDuration - timeRemaining;
    
    setActiveInject(null);
    setInjectStartTime(null);
    setShowCustomInput(false);
    setCustomCountermeasure("");
  };

  const handleCustomResponse = () => {
    if (!activeInject || !injectStartTime || !customCountermeasure.trim()) return;

    const responseTime = (Date.now() - injectStartTime) / 1000;
    setResponseTimes((prev) => [...prev, responseTime]);
    setDecisionsTotal((prev) => prev + 1);

    // Custom responses get moderate effectiveness (55-75 based on length and keywords)
    const hasKeywords = ['statement', 'media', 'respond', 'clarify', 'deny', 'evidence', 'fact', 'truth', 'report'].some(
      keyword => customCountermeasure.toLowerCase().includes(keyword)
    );
    const lengthBonus = Math.min(20, customCountermeasure.length / 10);
    const effectiveness = Math.min(85, 55 + (hasKeywords ? 15 : 0) + lengthBonus);
    const wasCorrect = effectiveness >= 65;

    // Record response for debrief
    const record: ResponseRecord = {
      injectId: activeInject.id,
      injectType: activeInject.type,
      injectContent: activeInject.content,
      responseLabel: customCountermeasure.substring(0, 50) + (customCountermeasure.length > 50 ? '...' : ''),
      responseType: 'custom',
      effectiveness: Math.round(effectiveness),
      responseTime,
      wasCorrect,
      timestamp: totalDuration - timeRemaining
    };
    setResponseHistory((prev) => [...prev, record]);
    
    if (wasCorrect) {
      setDecisionsCorrect((prev) => prev + 1);
      setNarrativeControl((prev) => Math.min(100, prev + (effectiveness / 10)));
      setReputationDamage((prev) => Math.max(0, prev - (effectiveness / 15)));
    } else {
      setNarrativeControl((prev) => Math.max(0, prev - 3));
    }

    setEventLog((prev) => [
      {
        time: totalDuration - timeRemaining,
        message: `Custom Response: "${customCountermeasure.substring(0, 40)}..." (${Math.round(effectiveness)}% effective)`,
        type: "response"
      },
      ...prev
    ]);

    // Track when we responded for accelerated next inject
    lastResponseTimeRef.current = totalDuration - timeRemaining;

    setActiveInject(null);
    setInjectStartTime(null);
    setShowCustomInput(false);
    setCustomCountermeasure("");
  };

  const handleExerciseComplete = () => {
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const score: TeamScore = {
      team: "blue",
      points: Math.round((narrativeControl * 10) + ((100 - reputationDamage) * 5)),
      reputationDamage,
      narrativeControl,
      responseTime: avgResponseTime,
      decisionsCorrect,
      decisionsTotal
    };

    onComplete(score, responseHistory, eventLog);
  };

  const getInjectIcon = (type: Inject["type"]) => {
    switch (type) {
      case "social_post": return <MessageSquare className="h-5 w-5" />;
      case "news_article": return <Newspaper className="h-5 w-5" />;
      case "influencer": return <Users className="h-5 w-5" />;
      case "official_response": return <Radio className="h-5 w-5" />;
      case "leak": return <AlertTriangle className="h-5 w-5" />;
      case "amplification": return <Zap className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin rounded-full mb-6" />
          <h2 className="text-xl font-bold uppercase tracking-wider">Preparing Exercise</h2>
          <p className="text-muted-foreground">Loading scenario elements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Top Bar with Timer */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b-4 border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit
            </Button>
            <div>
              <span className="font-bold uppercase tracking-wider text-sm">{config.brandName}</span>
              <span className="block text-xs text-muted-foreground uppercase">Crisis Exercise</span>
            </div>
          </div>

          <CountdownTimer 
            timeRemaining={timeRemaining} 
            totalDuration={totalDuration}
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused(!isPaused)}
          />

            <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-xl font-bold ${narrativeControl >= 50 ? 'text-success' : 'text-destructive'}`}>
                  {Math.round(narrativeControl)}%
                </span>
                {narrativeControl >= 50 ? 
                  <TrendingUp className="h-4 w-4 text-success" /> : 
                  <TrendingDown className="h-4 w-4 text-destructive" />
                }
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Narrative Control</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-xl font-bold ${reputationDamage <= 30 ? 'text-success' : 'text-destructive'}`}>
                  {Math.round(reputationDamage)}%
                </span>
                <Shield className={`h-4 w-4 ${reputationDamage <= 30 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Reputation Damage</span>
            </div>
          </div>
        </div>
        <Progress 
          value={(timeRemaining / totalDuration) * 100} 
          className={`h-1 ${timeRemaining <= 60 ? 'bg-destructive/20' : 'bg-muted'}`}
        />
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-8 container mx-auto px-4 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Scenario & Event Log */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-4 border-border bg-card">
              <CardHeader className="border-b-4 border-border py-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Target className="h-4 w-4 text-destructive" />
                  Active Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2">{scenario.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-4">{scenario.narrative}</p>
              </CardContent>
            </Card>

            <Card className="border-4 border-border bg-card">
              <CardHeader className="border-b-4 border-border py-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Radio className="h-4 w-4 text-warning" />
                  Event Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-2">
                    {eventLog.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Events will appear here...
                      </p>
                    ) : (
                      eventLog.map((event, i) => (
                        <div 
                          key={i} 
                          className={`text-xs p-2 border-l-2 ${
                            event.type === "inject" ? "border-destructive bg-destructive/5" :
                            event.type === "response" ? "border-success bg-success/5" :
                            "border-muted bg-muted/50"
                          }`}
                        >
                          <span className="text-muted-foreground">{Math.floor(event.time / 60)}:{(event.time % 60).toString().padStart(2, '0')}</span>
                          <span className="ml-2">{event.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Active Inject */}
          <div className="lg:col-span-2">
            {activeInject ? (
              <Card className={`border-4 ${activeInject.isAggressive ? 'border-destructive glow-danger' : 'border-warning'} bg-card animate-scale-in`}>
                <CardHeader className={`border-b-4 ${activeInject.isAggressive ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 uppercase tracking-wider">
                      <div className={`p-2 ${activeInject.isAggressive ? 'bg-destructive' : 'bg-warning'} text-background`}>
                        {getInjectIcon(activeInject.type)}
                      </div>
                      <div>
                        <span className="block text-lg">{activeInject.type.replace("_", " ").toUpperCase()}</span>
                        <span className="block text-xs text-muted-foreground font-normal">{activeInject.source}</span>
                      </div>
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className={`uppercase tracking-wider ${
                        activeInject.sentiment === "hostile" ? "border-destructive text-destructive" :
                        activeInject.sentiment === "confused" ? "border-warning text-warning" :
                        "border-muted"
                      }`}
                    >
                      {activeInject.sentiment}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <p className="text-lg leading-relaxed">{activeInject.content}</p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Reach: {activeInject.reach.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="h-4 w-4" />
                        Requires Response
                      </span>
                    </div>
                  </div>

                  <div className="border-t-4 border-border pt-6">
                    <h4 className="text-sm uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      Choose Your Response
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {activeInject.responseOptions?.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleResponse(option)}
                          className={`p-4 border-2 text-left transition-all hover:scale-[1.02] ${
                            option.effectiveness >= 80 ? 'border-success hover:bg-success/10' :
                            option.effectiveness >= 60 ? 'border-warning hover:bg-warning/10' :
                            'border-destructive hover:bg-destructive/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {option.type === "greyguards_service" && <Shield className="h-4 w-4 text-primary" />}
                            <span className="font-bold uppercase tracking-wider text-sm">{option.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className={`${
                              option.riskLevel === "low" ? "border-success text-success" :
                              option.riskLevel === "medium" ? "border-warning text-warning" :
                              "border-destructive text-destructive"
                            }`}>
                              {option.riskLevel} risk
                            </Badge>
                            <span className="text-muted-foreground">{option.timeToExecute}s</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Custom Countermeasure Option */}
                    <div className="mt-6 border-t-2 border-border pt-4">
                      {!showCustomInput ? (
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCustomInput(true)}
                          className="w-full border-2 border-primary/50 hover:bg-primary/10 uppercase tracking-wider"
                        >
                          <PenLine className="h-4 w-4 mr-2" />
                          Write Your Own Countermeasure
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <PenLine className="h-4 w-4" />
                            <span className="uppercase tracking-wider">Custom Response</span>
                          </div>
                          <Textarea
                            placeholder="Describe your countermeasure strategy... (e.g., 'Issue a transparent statement addressing the claims directly, provide evidence of our practices, and engage key media contacts for balanced coverage')"
                            value={customCountermeasure}
                            onChange={(e) => setCustomCountermeasure(e.target.value)}
                            className="min-h-[100px] border-2 border-primary/30 focus:border-primary"
                          />
                          <div className="flex gap-2">
                            <Button 
                              onClick={handleCustomResponse}
                              disabled={!customCountermeasure.trim()}
                              className="flex-1 uppercase tracking-wider"
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit Response
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => {
                                setShowCustomInput(false);
                                setCustomCountermeasure("");
                              }}
                              className="uppercase tracking-wider"
                            >
                              Cancel
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Tip: Include specific actions, channels, and key messages for higher effectiveness
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-4 border-border bg-card h-full flex items-center justify-center">
                <CardContent className="text-center p-12">
                  <Clock className="h-16 w-16 mx-auto mb-6 text-muted-foreground animate-pulse" />
                  <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Monitoring...</h3>
                  <p className="text-muted-foreground">
                    Watching for developments. The next event will appear when the narrative evolves.
                  </p>
                  <div className="mt-6 text-sm text-muted-foreground">
                    <span className="font-mono">{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</span> remaining
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="border-2 border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-success">{decisionsCorrect}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Correct Decisions</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{decisionsTotal}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Decisions</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-warning">
                    {responseTimes.length > 0 
                      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
                      : 0}s
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Avg Response</div>
                </CardContent>
              </Card>
              <Card className="border-2 border-border bg-card">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{injects.length}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Injects</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExercisePlayer;
