import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAccessProfile } from "@/hooks/useAccessProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, ArrowLeft, Mail } from "lucide-react";

interface AccessRequest {
  id: string;
  full_name: string;
  organisation: string;
  email: string;
  brand_name: string;
  use_case: string | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  decision_notes: string | null;
  email_domain_matches_brand: boolean | null;
}

export default function AdminRequests() {
  const access = useAccessProfile();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (access.loading) return;
    if (!access.isAdmin) {
      navigate("/");
      return;
    }
    void load();
  }, [access.loading, access.isAdmin, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load requests", description: error.message, variant: "destructive" });
    } else {
      setRequests((data || []) as AccessRequest[]);
    }
    setLoading(false);
  };

  const approve = async (id: string) => {
    setBusyId(id);
    const { data, error } = await supabase.rpc("admin_approve_access_request", {
      _request_id: id,
      _notes: notes[id] || null,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Approve failed", description: error.message, variant: "destructive" });
      return;
    }
    const result = data as { provisioned?: boolean; status?: string } | null;
    toast({
      title: result?.provisioned ? "Approved & provisioned" : "Approved — awaiting signup",
      description: result?.provisioned
        ? "Brand access granted to existing account."
        : "User has not signed up yet. Brand access will need re-running after they create an account.",
    });
    void load();
  };

  const reject = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("admin_reject_access_request", {
      _request_id: id,
      _notes: notes[id] || null,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Request rejected" });
    void load();
  };

  if (access.loading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider">Access Requests</h1>
            <p className="text-sm text-muted-foreground">Admin-only review of full-platform access requests.</p>
          </div>
          <Badge variant="outline" className="text-xs">{pending.length} pending</Badge>
        </div>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Pending</h2>
          {pending.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No pending requests.</CardContent></Card>
          )}
          {pending.map((r) => (
            <Card key={r.id} className="border-4 border-border">
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">{r.full_name} <span className="text-muted-foreground font-normal">— {r.organisation}</span></CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" /> {r.email}
                    </CardDescription>
                  </div>
                  {r.email_domain_matches_brand ? (
                    <Badge className="bg-success/20 text-success border-success/40"><ShieldCheck className="h-3 w-3 mr-1" /> Domain matches brand</Badge>
                  ) : (
                    <Badge variant="outline" className="border-warning/40 text-warning"><ShieldAlert className="h-3 w-3 mr-1" /> Verify domain manually</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Brand to lock</div>
                    <div className="font-medium">{r.brand_name}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-muted-foreground">Submitted</div>
                    <div>{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                </div>
                {r.use_case && (
                  <div className="text-sm">
                    <div className="text-xs uppercase text-muted-foreground mb-1">Use case</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{r.use_case}</div>
                  </div>
                )}
                <Textarea
                  placeholder="Decision notes (optional)"
                  value={notes[r.id] || ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button onClick={() => approve(r.id)} disabled={busyId === r.id} className="flex-1">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & provision
                  </Button>
                  <Button variant="outline" onClick={() => reject(r.id)} disabled={busyId === r.id} className="flex-1">
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {handled.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">History</h2>
            {handled.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.full_name} — {r.organisation} <span className="text-muted-foreground">({r.brand_name})</span></div>
                    <div className="text-xs text-muted-foreground truncate">{r.email} · {r.approved_at ? new Date(r.approved_at).toLocaleString() : ""}</div>
                    {r.decision_notes && <div className="text-xs text-muted-foreground italic mt-1">“{r.decision_notes}”</div>}
                  </div>
                  <Badge variant="outline" className="capitalize shrink-0">{r.status.replace(/_/g, " ")}</Badge>
                </CardContent>
              </Card>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
