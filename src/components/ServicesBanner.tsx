import { useState, useEffect } from "react";

// Single shared promotional banner shown on every route.
// Dismissed state lives in sessionStorage so it clears on a fresh visit.
const STORAGE_KEY = "gg-services-banner-dismissed";

const ServicesBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100]">
      <a
        href="https://greyguards.com/services.html"
        className="flex items-center justify-center gap-2 border-t border-border bg-background px-12 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <span>See all our services</span>
        <span aria-hidden="true" className="text-crimson">
          →
        </span>
      </a>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-lg leading-none text-warmgrey transition-colors hover:text-foreground"
      >
        ×
      </button>
    </div>
  );
};

export default ServicesBanner;
