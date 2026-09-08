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
    let done = false;

    const bail = () => {
      if (cancelled || done) return;
      done = true;
      // Navigate first so nobody is ever stranded on "Verifying access…";
      // clearing the stale local session happens in the background.
      navigate(loginPath, { replace: true });
      void Promise.resolve(supabase.auth.signOut({ scope: "local" })).catch(() => { /* ignore */ });
    };

    // Hard safety net: never sit on the verifying screen for more than 6s.
    const safetyNet = setTimeout(bail, 6000);

    const check = async () => {
      try {
        const result = await Promise.race([
          supabase.auth.getUser(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
        ]);
        if (cancelled || done) return;
        const user = result?.data?.user;
        if (!user || user.is_anonymous) {
          bail();
          return;
        }
        done = true;
        setStatus("allowed");
      } catch {
        bail();
      }
    };

    void check();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") navigate(loginPath, { replace: true });
    });

    return () => {
      cancelled = true;
      clearTimeout(safetyNet);
      sub.subscription.unsubscribe();
    };
  }, [loginPath, navigate]);


  if (status === "checking") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm uppercase tracking-wider">
        <span>Verifying access…</span>
        <button
          type="button"
          onClick={() => navigate(loginPath, { replace: true })}
          className="text-xs underline underline-offset-4 hover:text-foreground"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
