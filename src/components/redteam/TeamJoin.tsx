import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Target, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import greyguardsLogo from "@/assets/greyguards-logo.png";
import { Link } from "react-router-dom";

interface TeamJoinProps {
  onJoinSession: (sessionId: string, teamId: string, teamType: "blue" | "red", sessionData: any) => void;
  onBack: () => void;
}

const TeamJoin = ({ onJoinSession, onBack }: TeamJoinProps) => {
  const [sessionCode, setSessionCode] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<"blue" | "red" | null>(null);
  const [teamName, setTeamName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);
  const [step, setStep] = useState<"code" | "team">("code");

  const handleLookupSession = async () => {
    if (!sessionCode.trim()) {
      toast.error("Please enter a session code");
      return;
    }

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .rpc("lookup_session_by_code", { _code: sessionCode.toUpperCase() });

      if (error) throw error;

      const session = Array.isArray(data) ? data[0] : data;
      if (!session) {
        toast.error("Session not found. Check the code and try again.");
        return;
      }

      if (session.status === "completed") {
        toast.error("This session has already ended.");
        return;
      }

      const { data: teams } = await supabase
        .rpc("list_session_team_slots", { _session_id: session.id });

      setSessionData({ ...session, teams: teams || [] });
      setStep("team");
    } catch (error) {
      console.error("Error looking up session:", error);
      toast.error("Failed to find session");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!selectedTeam || !sessionData) return;

    setIsJoining(true);
    try {
      const existingTeam = sessionData.teams?.find((t: any) => t.team_type === selectedTeam && t.is_connected);
      if (existingTeam) {
        toast.error(`The ${selectedTeam} team is already connected`);
        setIsJoining(false);
        return;
      }

      const finalTeamName = teamName || `${selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team`;
      const { data: teamId, error } = await supabase
        .rpc("join_exercise_team", {
          _session_id: sessionData.id,
          _team_type: selectedTeam,
          _team_name: finalTeamName,
        });

      if (error) throw error;

      toast.success(`Joined as ${selectedTeam} team!`);
      onJoinSession(sessionData.id, teamId as string, selectedTeam, sessionData);
    } catch (error) {
      console.error("Error joining team:", error);
      toast.error("Failed to join team");
    } finally {
      setIsJoining(false);
    }
  };


  const isTeamTaken = (teamType: "blue" | "red") => {
    return sessionData?.teams?.some((t: any) => t.team_type === teamType && t.is_connected);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-4 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={greyguardsLogo} alt="Greyguards" className="h-10 w-auto" />
            <div>
              <span className="text-xl font-bold tracking-wider uppercase text-foreground">Greyguards</span>
              <span className="block text-xs tracking-widest uppercase text-muted-foreground">Red Team</span>
            </div>
          </Link>
          <Badge variant="outline" className="border-primary text-primary uppercase tracking-wider">
            <Users className="h-3 w-3 mr-1" />
            Join Exercise
          </Badge>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            onClick={step === "team" ? () => setStep("code") : onBack} 
            className="mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step === "code" ? (
            <Card className="border-4 border-border">
              <CardHeader className="border-b-4 border-border">
                <CardTitle className="text-center uppercase tracking-wider">
                  Enter Session Code
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <p className="text-center text-muted-foreground">
                  Ask your facilitator for the session code displayed on their screen
                </p>
                
                <div className="space-y-2">
                  <Label className="uppercase tracking-wider text-sm">Session Code</Label>
                  <Input
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    placeholder="e.g., ABC123"
                    className="text-center text-2xl font-mono uppercase tracking-widest h-16 border-2"
                    maxLength={8}
                  />
                </div>

                <Button
                  onClick={handleLookupSession}
                  disabled={!sessionCode.trim() || isJoining}
                  className="w-full h-12 uppercase tracking-wider"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    "Find Session"
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-4 border-border">
              <CardHeader className="border-b-4 border-border">
                <CardTitle className="text-center uppercase tracking-wider">
                  Choose Your Team
                </CardTitle>
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {sessionData?.brand_name} - {sessionData?.duration} min exercise
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedTeam("blue")}
                    disabled={isTeamTaken("blue")}
                    className={`p-6 border-4 transition-all text-center ${
                      selectedTeam === "blue" 
                        ? "border-primary bg-primary/10" 
                        : isTeamTaken("blue")
                        ? "border-muted bg-muted/50 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Shield className={`h-12 w-12 mx-auto mb-3 ${selectedTeam === "blue" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-bold uppercase tracking-wider block">Blue Team</span>
                    <span className="text-xs text-muted-foreground block mt-1">Defenders</span>
                    {isTeamTaken("blue") && (
                      <Badge variant="secondary" className="mt-2">Connected</Badge>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedTeam("red")}
                    disabled={isTeamTaken("red")}
                    className={`p-6 border-4 transition-all text-center ${
                      selectedTeam === "red" 
                        ? "border-destructive bg-destructive/10" 
                        : isTeamTaken("red")
                        ? "border-muted bg-muted/50 opacity-50 cursor-not-allowed"
                        : "border-border hover:border-destructive/50"
                    }`}
                  >
                    <Target className={`h-12 w-12 mx-auto mb-3 ${selectedTeam === "red" ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className="font-bold uppercase tracking-wider block">Red Team</span>
                    <span className="text-xs text-muted-foreground block mt-1">Attackers</span>
                    {isTeamTaken("red") && (
                      <Badge variant="secondary" className="mt-2">Connected</Badge>
                    )}
                  </button>
                </div>

                {selectedTeam && (
                  <div className="space-y-2">
                    <Label className="uppercase tracking-wider text-sm">Team Name (Optional)</Label>
                    <Input
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder={`${selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1)} Team`}
                      className="border-2"
                    />
                  </div>
                )}

                <Button
                  onClick={handleJoinTeam}
                  disabled={!selectedTeam || isJoining}
                  className={`w-full h-12 uppercase tracking-wider ${
                    selectedTeam === "red" ? "bg-destructive hover:bg-destructive/90" : ""
                  }`}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    `Join as ${selectedTeam ? selectedTeam.charAt(0).toUpperCase() + selectedTeam.slice(1) : ""} Team`
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamJoin;
