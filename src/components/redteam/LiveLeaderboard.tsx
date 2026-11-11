import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { scoreAdversarial, type AdversarialScore, type ScoreInject, type ScoreResponse } from "@/lib/adversarialScore";

interface Props { sessionId: string; compact?: boolean }

const LiveLeaderboard = ({ sessionId, compact = false }: Props) => {
  const [score, setScore] = useState<AdversarialScore | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [{ data: inj }, { data: res }] = await Promise.all([
        supabase.from("exercise_injects").select("id, created_by, is_sent, sent_at").eq("session_id", sessionId),
        supabase.from("exercise_responses").select("inject_id, effectiveness, response_time_seconds").eq("session_id", sessionId),
      ]);
      if (alive) setScore(scoreAdversarial((inj ?? []) as ScoreInject[], (res ?? []) as ScoreResponse[]));
    };
    void load();
    const channel = supabase.channel(`leaderboard-${sessionId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "exercise_injects", filter: `session_id=eq.${sessionId}` }, () => void load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "exercise_responses", filter: `session_id=eq.${sessionId}` }, () => void load())
      .subscribe();
    const poll = setInterval(load, 8000);
    return () => { alive = false; clearInterval(poll); supabase.removeChannel(channel); };
  }, [sessionId]);

  if (!score) return null;
  const leader = score.fired === 0 ? "Level" : score.blue > score.red ? "Blue leads" : score.red > score.blue ? "Red leads" : "Level";

  return (
    <div className="border border-border bg-card px-3 py-2" aria-label="Live leaderboard">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>Live leaderboard</span><span className="text-foreground">{leader}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 font-display tabular-nums">
        <span className="text-defender text-xl">{score.blue}</span>
        <div className="flex h-2 flex-1 overflow-hidden border border-border">
          <div className="bg-defender transition-all duration-700" style={{ width: `${score.blue}%` }} />
          <div className="bg-destructive transition-all duration-700" style={{ width: `${score.red}%` }} />
        </div>
        <span className="text-destructive text-xl">{score.red}</span>
      </div>
      {!compact && (
        <div className="mt-1 flex flex-wrap gap-x-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Fired {score.fired}</span><span>Countered {score.countered}</span><span>Unanswered {score.unanswered}</span>
          {score.avgResponseSeconds != null && <span>Avg reply {score.avgResponseSeconds}s</span>}
        </div>
      )}
    </div>
  );
};
export default LiveLeaderboard;
