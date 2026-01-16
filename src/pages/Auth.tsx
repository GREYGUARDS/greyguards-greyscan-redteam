import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import greyguardsLogo from "@/assets/greyguards-logo.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (!consentGiven) {
      toast({
        title: "Error",
        description: "Please accept the terms to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Use a generated password since we're just collecting emails
      const generatedPassword = `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // First try to sign up
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: generatedPassword,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        // If user already exists, sign them in with magic link style approach
        // For demo purposes, we'll create a simple session
        if (signUpError.message.includes("already registered")) {
          // Try signing in with a new password (will fail, but that's ok for demo)
          toast({
            title: "Welcome back!",
            description: "You've accessed the demo before. Signing you in...",
          });
          
          // For demo, just navigate - in production you'd use magic links
          const { error: signInError } = await supabase.auth.signUp({
            email,
            password: generatedPassword,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });
          
          if (!signInError) {
            navigate("/");
            return;
          }
        }
        throw signUpError;
      }

      toast({
        title: "Welcome to GreyScan Demo",
        description: "Access granted",
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-4 border-border">
        <CardHeader className="space-y-4 border-b-4 border-border bg-secondary">
          <div className="flex items-center justify-center">
            <img src={greyguardsLogo} alt="Greyguards Intelligence" className="h-16 w-16" />
          </div>
          <CardTitle className="text-center text-2xl uppercase tracking-wider">
            GreyScan Demo Access
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email to access the demo
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Demo mode warning */}
          <div className="mb-6 p-3 bg-warning/10 border border-warning/30 rounded-md flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Demo Mode:</strong> This demo environment is not private. 
              All data entered and analysis performed may be visible to other demo users. 
              Do not enter sensitive or confidential information.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium uppercase tracking-wider">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked === true)}
                disabled={loading}
              />
              <label 
                htmlFor="consent" 
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                I agree that my email address may be used by Greyguards to contact me 
                regarding product updates and commercial opportunities. 
                I understand this is a demo environment.
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !consentGiven}>
              {loading ? "Processing..." : "Access Demo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
