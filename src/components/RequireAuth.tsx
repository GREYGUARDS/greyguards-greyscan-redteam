import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { canAccessProduct } from "@/lib/guestExerciseAccess";
import { isGreyscanOperator } from "@/lib/greyscanAccess";

interface RequireAuthProps {
  loginPath: string;
  children: React.ReactNode;
  allowGuest?: boolean;
  /** Only confirmed Greyguards/GreyScan staff; everyone else is sent to this path (the public demo). */
  operatorOnly?: string;
}

/**
 * Waits for the auth client to finish restoring the session before deciding.
 * Only redirects once several checks over a grace period confirm no session.
 */
export default function RequireAuth({ loginPath, children, allowGuest = false, operatorOnly }: RequireAuthProps) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let cancelled = false;
    let done = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const allow = () => {
      if (cancelled || done) return;
      done = true;
      setStatus("allowed");
    };
    const toDemo = () => {
      if (cancelled || done) return;
      done = true;
      navigate(operatorOnly!, { replace: true });
    };
    const decide = (user: any) => {
      if (!canAccessProduct(user, allowGuest)) bail();
      else if (operatorOnly && !isGreyscanOperator(user)) toDemo();
      else allow();
    };
    const bail = () => {
      if (cancelled || done) return;
      done = true;
      navigate(loginPath, { replace: true });
    };

    const tryLocal = async (final = false) => {
      if (cancelled || done) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled || done) return;
        const user = session?.user ?? null;
        if (user) {
          decide(user);
          return;
        }
      } catch { /* retry */ }
      if (final) bail();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        done = false;
        bail();
        return;
      }
      if (session?.user) {
        decide(session.user);
      }
    });

    void tryLocal();
    [500, 1500, 3000].forEach((ms) => timers.push(setTimeout(() => void tryLocal(), ms)));
    timers.push(setTimeout(() => void tryLocal(true), 5000));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      sub.subscription.unsubscribe();
    };
  }, [loginPath, navigate, allowGuest, operatorOnly]);

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
