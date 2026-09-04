import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RequireAuthProps {
  loginPath: string;
  children: React.ReactNode;
}

/**
 * Gate that only renders children when a real (non-anonymous) session exists.
 * Anything else is redirected to the given login screen.
 */
export default function RequireAuth({ loginPath, children }: RequireAuthProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let cancelled = false;

    const bail = async () => {
      if (cancelled) return;
      // Clear any stale/expired local session so we don't loop on it.
      try { await supabase.auth.signOut({ scope: "local" }); } catch { /* ignore */ }
      if (!cancelled) navigate(loginPath, { replace: true });
    };

    const check = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000)),
        ]);
        if (cancelled) return;
        const user = result?.data?.user;
        if (!user || user.is_anonymous) {
          await bail();
          return;
        }
        setStatus("allowed");
      } catch {
        await bail();
      }
    };

    void check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate(loginPath, { replace: true });
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loginPath, navigate]);


  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm uppercase tracking-wider">
        Verifying access…
      </div>
    );
  }

  return <>{children}</>;
}
