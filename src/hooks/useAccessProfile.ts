import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AccessProfile {
  loading: boolean;
  userId: string | null;
  email: string | null;
  isAdmin: boolean;
  lockedBrand: string | null; // non-admins are locked to this brand
}

export function useAccessProfile(): AccessProfile {
  const [state, setState] = useState<AccessProfile>({
    loading: true,
    userId: null,
    email: null,
    isAdmin: false,
    lockedBrand: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState({ loading: false, userId: null, email: null, isAdmin: false, lockedBrand: null });
        return;
      }
      const email = (user.email || "").toLowerCase();
      const { data: adminRow } = await supabase
        .from("app_admins")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      const isAdmin = !!adminRow;

      let lockedBrand: string | null = null;
      if (!isAdmin) {
        const { data: brandRow } = await supabase.rpc("get_my_locked_brand");
        if (typeof brandRow === "string") lockedBrand = brandRow;
      }

      if (!cancelled) {
        setState({ loading: false, userId: user.id, email, isAdmin, lockedBrand });
      }
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
