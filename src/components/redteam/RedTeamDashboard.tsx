import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Target,
  Zap,
  Send,
  Clock,
  MessageSquare,
  Newspaper,
  Users,
  Radio,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import greyguardsLogo from "@/assets/greyguards-logo.png";
import { Link } from "react-router-dom";

interface RedTeamDashboardProps {
  sessionId: string;
  teamId: string;
  sessionData: any;
  onLeave: () => void;
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
  created_at: string;
}

const RedTeamDashboard = ({ sessionId, teamId, sessionData, onLeave }: RedTeamDashboardProps) => {
  const [session, setSession] = useState(sessionData);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [blueTeamStats, setBlueTeamStats] = useState({ narrativeControl: 50, reputationDamage: 20 });
  const [isSending, setIsSending] = useState(false);

  const [newInject, setNewInject] = useState({
    type: "social_post" as string,
    content: "",
    source: "",
    reach: 50000,
    sentiment: "hostile" as string,
    isAggressive: false
  });

  const presetInjects = [
    { label: "Anonymous Tip", type: "social_post", content: `BREAKING: Anonymous source reveals shocking information about ${session.brand_name}...`, source: "@AnonymousTipper (12K)", reach: 12000 },
    { label: "Fake Leak", type: "leak", content: `LEAKED: Internal ${session.brand_name} documents show concerning practices`, source: "SecretDocs.io", reach: 50000 },
    { label: "Influencer Pile-on", type: "influencer", content: `I've heard some things about ${session.brand_name} that are deeply troubling. Who else knows about this?`, source: "@TechInfluencer (500K)", reach: 500000 },
    { label: "News Pickup", type: "news_article", content: `"Questions Emerge About ${session.brand_name} Following Social Media Claims"`, source: "DailyBuzz.net", reach: 200000 },
    { label: "Bot Amplification", type: "amplification", content: `Coordinated campaign detected: 200+ accounts now spreading narratives about ${session.brand_name}`, source: "Bot Network", reach: 300000 },
  ];

  // Subscribe to real-time updates
  useEffect(() => {
    // Fetch initial data
    fetchInjects();
    fetchBlueTeamStats();

    // Subscribe to session updates
    const sessionChannel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercise_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          if (payload.new) setSession(payload.new);
        }
      )
      .subscribe();

    // Subscribe to inject updates
    const injectChannel = supabase
      .channel(`injects-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercise_injects', filter: `session_id=eq.${sessionId}` },
        () => fetchInjects()
      )
      .subscribe();

    // Subscribe to blue team stats
    const teamChannel = supabase
      .channel(`teams-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exercise_teams', filter: `session_id=eq.${sessionId}` },
        () => fetchBlueTeamStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(injectChannel);
      supabase.removeChannel(teamChannel);
    };
  }, [sessionId]);

  const fetchInjects = async () => {
    const { data } = await supabase
      .from("exercise_injects")
      .select("*")
      .eq("session_id", sessionId)
      .eq("created_by", "red_team")
      .order("created_at", { ascending: false });
    
    if (data) setInjects(data);
  };

  const fetchBlueTeamStats = async () => {
    const { data } = await supabase
      .from("exercise_teams")
      .select("*")
      .eq("session_id", sessionId)
      .eq("team_type", "blue")
      .maybeSingle();
    
    if (data) {
      setBlueTeamStats({
        narrativeControl: data.narrative_control || 50,
        reputationDamage: data.reputation_damage || 20
      });
    }
  };

  const handleSendInject = async () => {
    if (!newInject.content.trim()) {
      toast.error("Please enter inject content");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from("exercise_injects")
        .insert({
          session_id: sessionId,
          created_by: "red_team",
          inject_type: newInject.type,
          content: newInject.content,
          source: newInject.source || "Anonymous Source",
          reach: newInject.reach,
          sentiment: newInject.sentiment,
          is_aggressive: newInject.isAggressive,
          is_sent: session.status === "active",
          sent_at: session.status === "active" ? new Date().toISOString() : null
        });

      if (error) throw error;

      toast.success("Attack inject created!");
      setNewInject({
        type: "social_post",
        content: "",
        source: "",
        reach: 50000,
        sentiment: "hostile",
        isAggressive: false
      });
    } catch (error) {
      console.error("Error creating inject:", error);
      toast.error("Failed to create inject");
    } finally {
      setIsSending(false);
    }
  };

  const handleUsePreset = (preset: typeof presetInjects[0]) => {
    setNewInject({
      type: preset.type,
      content: preset.content,
      source: preset.source,
      reach: preset.reach,
      sentiment: "hostile",
      isAggressive: true
    });
  };

  const getInjectIcon = (type: string) => {
    switch (type) {
      case "social_post": return <MessageSquare className="h-4 w-4" />;
      case "news_article": return <Newspaper className="h-4 w-4" />;
      case "influencer": return <Users className="h-4 w-4" />;
      case "leak": return <AlertTriangle className="h-4 w-4" />;
      case "amplification": return <Zap className="h-4 w-4" />;
      case "official_response": return <Radio className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-destructive bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onLeave} className="uppercase tracking-wider">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Leave
            </Button>
            <div>
              <span className="font-bold uppercase tracking-wider text-destructive">{session.brand_name}</span>
              <span className="block text-xs text-muted-foreground uppercase">Red Team - Attackers</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={session.status === "active" ? "default" : "secondary"} className="uppercase">
              {session.status === "waiting" ? "Waiting to Start" : session.status === "active" ? "LIVE" : "Ended"}
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1 border-2 border-destructive bg-destructive/10">
              <Target className="h-4 w-4 text-destructive" />
              <span className="font-bold text-destructive uppercase text-sm">Red Team</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Blue Team Status Monitor */}
          <Card className="border-4 border-primary/30 bg-primary/5">
            <CardHeader className="border-b border-primary/20 py-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Enemy Status (Blue Team)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Narrative Control</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${blueTeamStats.narrativeControl >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {Math.round(blueTeamStats.narrativeControl)}%
                    </span>
                    {blueTeamStats.narrativeControl >= 50 ? 
                      <TrendingUp className="h-4 w-4 text-success" /> : 
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    }
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${blueTeamStats.narrativeControl >= 50 ? 'bg-success' : 'bg-destructive'}`}
                    style={{ width: `${blueTeamStats.narrativeControl}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Reputation Damage</span>
                  <span className="font-bold text-destructive">{Math.round(blueTeamStats.reputationDamage)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${blueTeamStats.reputationDamage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  {blueTeamStats.narrativeControl < 50 
                    ? "🎯 Blue team is struggling - keep up the pressure!"
                    : "⚠️ Blue team is holding - try more aggressive attacks"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Create Attack */}
          <Card className="border-4 border-destructive lg:col-span-2">
            <CardHeader className="border-b-4 border-destructive bg-destructive/10 py-3">
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-destructive" />
                Create Attack Inject
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Quick Presets */}
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Quick Attacks</Label>
                <div className="flex flex-wrap gap-2">
                  {presetInjects.map((preset, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUsePreset(preset)}
                      className="text-xs border-destructive/50 hover:bg-destructive/10"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Attack Type</Label>
                  <Select value={newInject.type} onValueChange={(v) => setNewInject({...newInject, type: v})}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_post">Social Post</SelectItem>
                      <SelectItem value="news_article">News Article</SelectItem>
                      <SelectItem value="influencer">Influencer</SelectItem>
                      <SelectItem value="leak">Document Leak</SelectItem>
                      <SelectItem value="amplification">Bot Amplification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Source</Label>
                  <Input
                    value={newInject.source}
                    onChange={(e) => setNewInject({...newInject, source: e.target.value})}
                    placeholder="@AccountName (50K)"
                    className="border-2"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider">Attack Content</Label>
                <Textarea
                  value={newInject.content}
                  onChange={(e) => setNewInject({...newInject, content: e.target.value})}
                  placeholder={`Craft your disinformation attack against ${session.brand_name}...`}
                  className="border-2 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider">Reach</Label>
                  <Input
                    type="number"
                    value={newInject.reach}
                    onChange={(e) => setNewInject({...newInject, reach: parseInt(e.target.value) || 0})}
                    className="border-2"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider">Sentiment</Label>
                  <Select value={newInject.sentiment} onValueChange={(v) => setNewInject({...newInject, sentiment: v})}>
                    <SelectTrigger className="border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hostile">Hostile</SelectItem>
                      <SelectItem value="confused">Confused</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={newInject.isAggressive}
                    onCheckedChange={(v) => setNewInject({...newInject, isAggressive: v})}
                  />
                  <Label className="text-xs uppercase tracking-wider">Aggressive</Label>
                </div>
              </div>

              <Button
                onClick={handleSendInject}
                disabled={!newInject.content.trim() || isSending}
                className="w-full bg-destructive hover:bg-destructive/90 uppercase tracking-wider"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Launch Attack
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Attack History */}
        <Card className="border-4 border-border mt-6">
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Your Attack History ({injects.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              {injects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attacks launched yet. Create your first inject above!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {injects.map((inject) => (
                    <div key={inject.id} className="p-4 hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 ${inject.is_sent ? 'bg-destructive' : 'bg-muted'} text-background`}>
                          {getInjectIcon(inject.inject_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs uppercase">
                              {inject.inject_type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{inject.source}</span>
                            {inject.is_aggressive && (
                              <Badge variant="destructive" className="text-[10px]">Aggressive</Badge>
                            )}
                          </div>
                          <p className="text-sm line-clamp-2">{inject.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Reach: {inject.reach.toLocaleString()}</span>
                            <span className={inject.is_sent ? 'text-destructive' : ''}>
                              {inject.is_sent ? "✓ Sent" : "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RedTeamDashboard;
