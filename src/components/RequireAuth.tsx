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

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user || user.is_anonymous) {
        navigate(loginPath, { replace: true });
        return;
      }
      setStatus("allowed");
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
