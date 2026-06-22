import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowRight, Lock } from "lucide-react";
import greyguardsLogo from "@/assets/greyguards-logo.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [useCase, setUseCase] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleCaseStudyAccess = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      toast({
        title: "Welcome to GreyScan",
        description: "Exploring fictional case studies",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !name || !organisation) {
      toast({
        title: "Missing details",
        description: "Please complete name, organisation and email",
        variant: "destructive",
      });
      return;
    }

    if (!consentGiven) {
      toast({
        title: "Consent required",
        description: "Please accept the terms to submit your request",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Record the request as a signup (acts as a lead capture).
      const generatedPassword = `request_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: generatedPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: name,
            organisation,
            use_case: useCase,
            request_type: "full_access",
          },
        },
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        throw signUpError;
      }

      toast({
        title: "Request received",
        description: "Our team will be in touch within one business day. Opening the case-study environment now.",
      });

      // Drop them into the case-study environment in the meantime.
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-4 border-border">
        <CardHeader className="space-y-4 border-b-4 border-border bg-secondary">
          <div className="flex items-center justify-center">
            <img src={greyguardsLogo} alt="Greyguards Intelligence" className="h-16 w-16" />
          </div>
          <CardTitle className="text-center text-2xl uppercase tracking-wider">
            GreyScan Access
          </CardTitle>
          <CardDescription className="text-center">
            Explore fictional case studies, or request access to the full platform
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Demo environment:</strong> Case studies use fictional companies and synthetic data. Do not enter sensitive or confidential information.
            </p>
          </div>

          {/* Primary: case studies */}
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full h-12 text-base"
              onClick={handleCaseStudyAccess}
              disabled={loading}
            >
              {loading ? "Loading..." : "Explore Case Studies"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Instant access. Seven fictional organisations across defence, finance and tech.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Secondary: request full access */}
          {!showRequestForm ? (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowRequestForm(true)}
                disabled={loading}
              >
                <Lock className="mr-2 h-4 w-4" />
                Request Full Platform Access
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                For verified organisations. Live data sources, custom monitoring, red-team exercises.
              </p>
            </div>
          ) : (
            <form onSubmit={handleRequestAccess} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-medium uppercase tracking-wider">Name</label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={loading} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="org" className="text-xs font-medium uppercase tracking-wider">Organisation</label>
                <Input id="org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Acme Defence Ltd" disabled={loading} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wider">Work Email</label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.com" disabled={loading} required />
              </div>
              <div className="space-y-2">
                <label htmlFor="useCase" className="text-xs font-medium uppercase tracking-wider">Use Case (optional)</label>
                <Textarea id="useCase" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Briefly describe what you'd like to monitor or evaluate" disabled={loading} rows={3} />
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  disabled={loading}
                />
                <label htmlFor="consent" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                  I agree that Greyguards may contact me regarding this access request and related product updates.
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowRequestForm(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || !consentGiven}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
