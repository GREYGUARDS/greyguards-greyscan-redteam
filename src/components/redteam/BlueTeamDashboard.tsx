import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Shield,
  Clock,
  MessageSquare,
  Newspaper,
  Users,
  Radio,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  Send,
  PenLine,
  Loader2,
  Volume2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import greyguardsLogo from "@/assets/greyguards-logo.png";
import { Link } from "react-router-dom";
import CountdownTimer from "./CountdownTimer";

interface BlueTeamDashboardProps {
  sessionId: string;
  teamId: string;
  sessionData: any;
  onLeave: () => void;
  onComplete: (score: any) => void;
}

interface Inject {
  id: string;
  inject_type: string;
  content: string;
  source: string;
  reach: number;
  sentiment: string;
  is_aggressive: boolean;
  is_sent: boolean;
  sent_at: string | null;
  created_by: string;
}

interface ResponseOption {
  id: string;
  label: string;
  description: string;
  type: string;
  effectiveness: number;
  riskLevel: "low" | "medium" | "high";
}

const BlueTeamDashboard = ({ sessionId, teamId, sessionData, onLeave, onComplete }: BlueTeamDashboardProps) => {
  const [session, setSession] = useState(sessionData);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [activeInject, setActiveInject] = useState<Inject | null>(null);
  const [narrativeControl, setNarrativeControl] = useState(50);
  const [reputationDamage, setReputationDamage] = useState(20);
  const [decisionsCorrect, setDecisionsCorrect] = useState(0);
  const [decisionsTotal, setDecisionsTotal] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(sessionData.duration * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [customCountermeasure, setCustomCountermeasure] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [eventLog, setEventLog] = useState<Array<{ time: number; message: string; type: string }>>([]);
  const injectStartTime = useRef<number | null>(null);

  const totalDuration = sessionData.duration * 60;

  // Generate response options for an inject
  const generateResponseOptions = (inject: Inject): ResponseOption[] => {
    const options: ResponseOption[] = [
      { id: "1", label: "Issue denial statement", description: "Quickly deny the allegations publicly", type: "statement", effectiveness: 60, riskLevel: "medium" },
      { id: "2", label: "Monitor & gather intel", description: "Watch the situation develop before responding", type: "internal_action", effectiveness: 70, riskLevel: "low" },
      { id: "3", label: "Engage Greyguards", description: "Contact crisis management team for guidance", type: "greyguards_service", effectiveness: 85, riskLevel: "low" },
    ];

    if (inject.inject_type === "news_article") {
      options.push({ id: "4", label: "Contact editor", description: "Request correction or balanced coverage", type: "media_outreach", effectiveness: 75, riskLevel: "low" });
    }

    if (inject.inject_type === "influencer") {
      options.push({ id: "5", label: "DM the influencer", description: "Privately reach out with facts", type: "social_response", effectiveness: 80, riskLevel: "low" });
    }

    return options;
  };

  // Subscribe to real-time updates
  useEffect(() => {
    // Fetch initial data
    fetchInjects();

    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`blue-session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercise_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          if (payload.new) {
            const newSession = payload.new as any;
            setSession(newSession);
            if (newSession.status === "active" && session.status === "waiting") {
              setIsPaused(false);
              toast.success("Exercise started!");
            }
          }
        }
      )
      .subscribe();

    // Subscribe to new injects
    const injectChannel = supabase
      .channel(`blue-injects-${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'exercise_injects', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newInject = payload.new as Inject;
          if (newInject.is_sent && !activeInject) {
            setActiveInject(newInject);
            injectStartTime.current = Date.now();
            setEventLog(prev => [{
              time: totalDuration - timeRemaining,
              message: `[${newInject.inject_type.toUpperCase()}] ${newInject.source}: "${newInject.content.substring(0, 50)}..."`,
              type: "inject"
            }, ...prev]);

            if (newInject.is_aggressive) {
              setReputationDamage(prev => Math.min(100, prev + 5));
              setNarrativeControl(prev => Math.max(0, prev - 5));
            }
          }
          fetchInjects();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'exercise_injects', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const updatedInject = payload.new as Inject;
          if (updatedInject.is_sent && !activeInject) {
            setActiveInject(updatedInject);
            injectStartTime.current = Date.now();
          }
          fetchInjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(injectChannel);
    };
  }, [sessionId, activeInject, session.status]);

  // Timer effect
  useEffect(() => {
    if (isPaused || timeRemaining <= 0 || session.status !== "active") return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, session.status]);

  // Update team stats in database
  useEffect(() => {
    const updateStats = async () => {
      await supabase
        .from("exercise_teams")
        .update({
          narrative_control: Math.round(narrativeControl),
          reputation_damage: Math.round(reputationDamage),
          decisions_correct: decisionsCorrect,
          decisions_total: decisionsTotal
        })
        .eq("id", teamId);
    };

    updateStats();
  }, [narrativeControl, reputationDamage, decisionsCorrect, decisionsTotal]);

  const fetchInjects = async () => {
    const { data } = await supabase
      .from("exercise_injects")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_sent", true)
      .order("sent_at", { ascending: false });

    if (data) setInjects(data);
  };

  const handleResponse = async (option: ResponseOption) => {
    if (!activeInject || !injectStartTime.current) return;

    const responseTime = (Date.now() - injectStartTime.current) / 1000;
    const wasCorrect = option.effectiveness >= 65;

    setResponseTimes(prev => [...prev, responseTime]);
    setDecisionsTotal(prev => prev + 1);

    if (wasCorrect) {
      setDecisionsCorrect(prev => prev + 1);
      setNarrativeControl(prev => Math.min(100, prev + (option.effectiveness / 10)));
      setReputationDamage(prev => Math.max(0, prev - (option.effectiveness / 15)));
    } else {
      setNarrativeControl(prev => Math.max(0, prev - 5));
      if (option.riskLevel === "high") {
        setReputationDamage(prev => Math.min(100, prev + 10));
      }
    }

    // Save response to database
    await supabase.from("exercise_responses").insert({
      session_id: sessionId,
      team_id: teamId,
      inject_id: activeInject.id,
      response_label: option.label,
      response_type: option.type,
      effectiveness: option.effectiveness,
      response_time_seconds: responseTime,
      was_correct: wasCorrect
    });

    setEventLog(prev => [{
      time: totalDuration - timeRemaining,
      message: `Response: ${option.label} (${option.effectiveness}% effective)`,
      type: "response"
    }, ...prev]);

    setActiveInject(null);
    injectStartTime.current = null;
    setShowCustomInput(false);
    setCustomCountermeasure("");
  };

  const handleCustomResponse = async () => {
    if (!activeInject || !injectStartTime.current || !customCountermeasure.trim()) return;

    const responseTime = (Date.now() - injectStartTime.current) / 1000;
    const hasKeywords = ['statement', 'media', 'respond', 'clarify', 'deny', 'evidence', 'fact', 'truth', 'report'].some(
      keyword => customCountermeasure.toLowerCase().includes(keyword)
    );
    const lengthBonus = Math.min(20, customCountermeasure.length / 10);
    const effectiveness = Math.min(85, 55 + (hasKeywords ? 15 : 0) + lengthBonus);
    const wasCorrect = effectiveness >= 65;

    setResponseTimes(prev => [...prev, responseTime]);
    setDecisionsTotal(prev => prev + 1);

    if (wasCorrect) {
      setDecisionsCorrect(prev => prev + 1);
      setNarrativeControl(prev => Math.min(100, prev + (effectiveness / 10)));
      setReputationDamage(prev => Math.max(0, prev - (effectiveness / 15)));
    } else {
      setNarrativeControl(prev => Math.max(0, prev - 3));
    }

    await supabase.from("exercise_responses").insert({
      session_id: sessionId,
      team_id: teamId,
      inject_id: activeInject.id,
      response_label: customCountermeasure.substring(0, 50),
      response_type: "custom",
      effectiveness: Math.round(effectiveness),
      response_time_seconds: responseTime,
      was_correct: wasCorrect,
      custom_response: customCountermeasure
    });

    setEventLog(prev => [{
      time: totalDuration - timeRemaining,
      message: `Custom Response: "${customCountermeasure.substring(0, 40)}..." (${Math.round(effectiveness)}% effective)`,
      type: "response"
    }, ...prev]);

    setActiveInject(null);
    injectStartTime.current = null;
    setShowCustomInput(false);
    setCustomCountermeasure("");
  };

  const handleExerciseComplete = () => {
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const score = {
      team: "blue",
      points: Math.round((narrativeControl * 10) + ((100 - reputationDamage) * 5)),
      reputationDamage,
      narrativeControl,
      responseTime: avgResponseTime,
      decisionsCorrect,
      decisionsTotal
    };

    onComplete(score);
  };

  const getInjectIcon = (type: string) => {
    switch (type) {
      case "social_post": return <MessageSquare className="h-5 w-5" />;
      case "news_article": return <Newspaper className="h-5 w-5" />;
      case "influencer": return <Users className="h-5 w-5" />;
      case "leak": return <AlertTriangle className="h-5 w-5" />;
      case "amplification": return <Zap className="h-5 w-5" />;
      case "official_response": return <Radio className="h-5 w-5" />;
      default: return <MessageSquare className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-auto">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b-4 border-primary">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onLeave} className="uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Leave
            </Button>
            <div>
              <span className="font-bold uppercase tracking-wider text-primary text-sm">{session.brand_name}</span>
              <span className="block text-xs text-muted-foreground uppercase">Blue Team - Defenders</span>
            </div>
          </div>

          {session.status === "active" ? (
            <CountdownTimer
              timeRemaining={timeRemaining}
              totalDuration={totalDuration}
              isPaused={isPaused}
              onPauseToggle={() => {}}
            />
          ) : (
            <Badge variant="secondary" className="uppercase">
              {session.status === "waiting" ? "Waiting for Start" : "Ended"}
            </Badge>
          )}

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
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Narrative</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-xl font-bold ${reputationDamage <= 30 ? 'text-success' : 'text-destructive'}`}>
                  {Math.round(reputationDamage)}%
                </span>
                <Shield className={`h-4 w-4 ${reputationDamage <= 30 ? 'text-success' : 'text-destructive'}`} />
              </div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Damage</span>
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
        {session.status === "waiting" ? (
          <Card className="border-4 border-border max-w-lg mx-auto mt-20">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-16 w-16 mx-auto mb-6 text-primary animate-spin" />
              <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Waiting for Exercise to Start</h3>
              <p className="text-muted-foreground">
                The facilitator will start the exercise shortly. Stay ready!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Log */}
            <Card className="border-4 border-border">
              <CardHeader className="border-b-4 border-border py-3">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Radio className="h-4 w-4 text-warning" />
                  Event Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
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

            {/* Active Inject */}
            <div className="lg:col-span-2">
              {activeInject ? (
                <Card className={`border-4 ${activeInject.is_aggressive ? 'border-destructive' : 'border-warning'} animate-scale-in`}>
                  <CardHeader className={`border-b-4 ${activeInject.is_aggressive ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 uppercase tracking-wider">
                        <div className={`p-2 ${activeInject.is_aggressive ? 'bg-destructive' : 'bg-warning'} text-background`}>
                          {getInjectIcon(activeInject.inject_type)}
                        </div>
                        <div>
                          <span className="block text-lg">{activeInject.inject_type.replace("_", " ").toUpperCase()}</span>
                          <span className="block text-xs text-muted-foreground font-normal">{activeInject.source}</span>
                        </div>
                      </CardTitle>
                      <Badge variant="outline" className={activeInject.created_by === "red_team" ? "border-destructive text-destructive" : ""}>
                        {activeInject.created_by === "red_team" ? "Red Team Attack" : "System"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-lg leading-relaxed mb-4">{activeInject.content}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Reach: {activeInject.reach.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Volume2 className="h-4 w-4" />
                        Requires Response
                      </span>
                    </div>

                    <div className="border-t-4 border-border pt-6">
                      <h4 className="text-sm uppercase tracking-wider font-bold mb-4">Choose Your Response</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {generateResponseOptions(activeInject).map((option) => (
                          <button
                            key={option.id}
                            onClick={() => handleResponse(option)}
                            className={`p-4 border-2 text-left transition-all hover:scale-[1.02] ${
                              option.effectiveness >= 80 ? 'border-success hover:bg-success/10' :
                              option.effectiveness >= 60 ? 'border-warning hover:bg-warning/10' :
                              'border-destructive hover:bg-destructive/10'
                            }`}
                          >
                            <span className="font-bold uppercase tracking-wider text-sm block mb-2">{option.label}</span>
                            <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                            <Badge variant="outline" className={`text-xs ${
                              option.riskLevel === "low" ? "border-success text-success" :
                              option.riskLevel === "medium" ? "border-warning text-warning" :
                              "border-destructive text-destructive"
                            }`}>
                              {option.riskLevel} risk
                            </Badge>
                          </button>
                        ))}
                      </div>

                      {/* Custom Response */}
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
                            <Textarea
                              placeholder="Describe your countermeasure strategy..."
                              value={customCountermeasure}
                              onChange={(e) => setCustomCountermeasure(e.target.value)}
                              className="min-h-[100px] border-2"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={handleCustomResponse}
                                disabled={!customCountermeasure.trim()}
                                className="flex-1 uppercase tracking-wider"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Submit
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => {
                                  setShowCustomInput(false);
                                  setCustomCountermeasure("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-4 border-border h-full flex items-center justify-center min-h-[400px]">
                  <CardContent className="text-center p-12">
                    <Clock className="h-16 w-16 mx-auto mb-6 text-muted-foreground animate-pulse" />
                    <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Monitoring...</h3>
                    <p className="text-muted-foreground">
                      Watching for attacks. Red team injects will appear when they strike.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlueTeamDashboard;
