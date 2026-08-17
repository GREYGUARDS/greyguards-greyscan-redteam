import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, ArrowRight, Lock, MailCheck, Crosshair, Shield } from "lucide-react";
import greyguardsLogo from "@/assets/greyguards-logo.png";

export type AuthVariant = "greyscan" | "redteam";

interface AuthScreenProps {
  variant: AuthVariant;
}

const COPY: Record<AuthVariant, {
  title: string;
  description: string;
  badge: string;
  landing: string;
  brandPlaceholder: string;
}> = {
  greyscan: {
    title: "GreyScan Access",
    description: "Narrative intelligence platform — authorised accounts only",
    badge: "Narrative Intelligence",
    landing: "/",
    brandPlaceholder: "The single brand your account will be locked to",
  },
  redteam: {
    title: "Red Team Access",
    description: "Crisis simulation exercises — authorised accounts only",
    badge: "Crisis Simulation",
    landing: "/redteam",
    brandPlaceholder: "The single brand your exercises will be locked to",
  },
};

export default function AuthScreen({ variant }: AuthScreenProps) {
  const copy = COPY[variant];
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<"signin" | "signup" | "request">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  // Request-access fields
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [brandName, setBrandName] = useState("");
  const [useCase, setUseCase] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Validate with the auth service instead of trusting a cached browser
    // session, which may be expired and can otherwise cause a redirect loop.
    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (cancelled) return;
      if (!error && user && !user.is_anonymous) {
        navigate(copy.landing, { replace: true });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user && !session.user.is_anonymous) {
        navigate(copy.landing, { replace: true });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate, copy.landing]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      // Grant any approved brand access on first successful login.
      await supabase.rpc("claim_brand_access");
      navigate(copy.landing, { replace: true });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message?.includes("Email not confirmed")
          ? "Please confirm your email address using the link we sent you, then try again."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}${copy.landing}` },
      });
      if (error) throw error;
      if (data.session) {
        await supabase.rpc("claim_brand_access");
        navigate(copy.landing, { replace: true });
        return;
      }
      setConfirmSent(true);
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({ title: "Enter your email", description: "Add your email address first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Could not send reset email", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Reset email sent", description: "Check your inbox for the password reset link." });
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !organisation || !brandName) {
      toast({ title: "Missing details", description: "Please complete name, organisation, brand and email", variant: "destructive" });
      return;
    }
    if (!consentGiven) {
      toast({ title: "Consent required", description: "Please accept the terms to submit your request", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error: insertError } = await supabase.from("platform_access_requests").insert({
        full_name: name,
        organisation,
        email,
        brand_name: brandName,
        use_case: useCase || null,
      });
      if (insertError) throw insertError;

      const subject = encodeURIComponent(
        `${variant === "redteam" ? "Red Team" : "GreyScan"} access request — ${organisation}`
      );
      const body = encodeURIComponent(
        `Name: ${name}\nOrganisation: ${organisation}\nBrand: ${brandName}\nEmail: ${email}\n\nUse case:\n${useCase || "(none provided)"}\n\n— Submitted via ${variant === "redteam" ? "Red Team" : "GreyScan"}`
      );
      window.location.href = `mailto:info@greyguards.com?subject=${subject}&body=${body}`;

      toast({
        title: "Request received",
        description: "We've recorded your request and notified the Greyguards team. Once approved, create your account here and sign in.",
      });
      setTab("signin");
      setName(""); setOrganisation(""); setBrandName(""); setUseCase(""); setConsentGiven(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const VariantIcon = variant === "redteam" ? Crosshair : Shield;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-4 border-border">
        <CardHeader className="space-y-4 border-b-4 border-border bg-secondary">
          <div className="flex items-center justify-center">
            <img src={greyguardsLogo} alt="Greyguards Intelligence" className="h-20 w-auto object-contain" />
          </div>
          <CardTitle className="text-center text-2xl uppercase tracking-wider flex items-center justify-center gap-2">
            <VariantIcon className="h-5 w-5" />
            {copy.title}
          </CardTitle>
          <CardDescription className="text-center">{copy.description}</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {confirmSent ? (
            <div className="space-y-4 text-center">
              <MailCheck className="h-10 w-10 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                We've sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click it to
                activate your account, then sign in here.
              </p>
              <Button variant="outline" className="w-full" onClick={() => { setConfirmSent(false); setTab("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={tab === "signin" ? "default" : "outline"}
                  className="uppercase tracking-wider text-xs"
                  onClick={() => setTab("signin")}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant={tab === "signup" ? "default" : "outline"}
                  className="uppercase tracking-wider text-xs"
                  onClick={() => setTab("signup")}
                >
                  Create account
                </Button>
              </div>

              {(tab === "signin" || tab === "signup") && (
                <form onSubmit={tab === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="auth-email" className="text-xs font-medium uppercase tracking-wider">Work Email</label>
                    <Input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@organisation.com"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="auth-password" className="text-xs font-medium uppercase tracking-wider">Password</label>
                    <Input
                      id="auth-password"
                      type="password"
                      autoComplete={tab === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    {tab === "signup" && (
                      <p className="text-[10px] text-muted-foreground">
                        Minimum 8 characters. You'll receive an email to confirm your address before first sign in.
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  {tab === "signin" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="w-full text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  )}
                </form>
              )}

              <div className="p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Closed platform:</strong> accounts must be approved by Greyguards
                  before data access is granted. Each account is limited to one brand.
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

              {tab !== "request" ? (
                <div className="space-y-2">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setTab("request")} disabled={loading}>
                    <Lock className="mr-2 h-4 w-4" />
                    Request Platform Access
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    For verified organisations. Live data sources, custom monitoring, red-team exercises.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestAccess} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="req-name" className="text-xs font-medium uppercase tracking-wider">Name</label>
                    <Input id="req-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-org" className="text-xs font-medium uppercase tracking-wider">Organisation</label>
                    <Input id="req-org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} placeholder="Acme Defence Ltd" disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-brand" className="text-xs font-medium uppercase tracking-wider">Brand to Monitor</label>
                    <Input id="req-brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder={copy.brandPlaceholder} disabled={loading} required />
                    <p className="text-[10px] text-muted-foreground">Your account will be limited to this one brand only.</p>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-email" className="text-xs font-medium uppercase tracking-wider">Work Email</label>
                    <Input id="req-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organisation.com" disabled={loading} required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="req-usecase" className="text-xs font-medium uppercase tracking-wider">Use Case (optional)</label>
                    <Textarea id="req-usecase" value={useCase} onChange={(e) => setUseCase(e.target.value)} placeholder="Briefly describe what you'd like to monitor or evaluate" disabled={loading} rows={3} />
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox id="req-consent" checked={consentGiven} onCheckedChange={(c) => setConsentGiven(c === true)} disabled={loading} />
                    <label htmlFor="req-consent" className="text-xs text-muted-foreground leading-tight cursor-pointer">
                      I agree that Greyguards may contact me regarding this access request and related product updates.
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setTab("signin")} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading || !consentGiven}>
                      {loading ? "Submitting…" : "Submit Request"}
                    </Button>
                  </div>
                </form>
              )}

              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-wider">
                {variant === "greyscan" ? (
                  <>Red Team exercises? <a href="/redteam/login" className="underline">Red Team login</a></>
                ) : (
                  <>Narrative monitoring? <a href="/login" className="underline">GreyScan login</a></>
                )}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
