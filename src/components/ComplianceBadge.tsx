import { Shield, Check } from "lucide-react";

/**
 * Inline System Compliance indicator (EU AI Act Article 50 / NIS2).
 * Rendered in-flow next to the export buttons — never fixed/overlay,
 * so it can never obscure page content or the primary CTA.
 */
export function ComplianceBadge() {
  return (
    <div className="inline-flex items-center gap-2 bg-card/95 backdrop-blur border border-border rounded-sm px-2.5 py-1.5 text-[10px] uppercase tracking-wider">
      <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
        <Shield className="h-3 w-3" />
        System Compliance
      </span>
      <span className="hidden sm:flex items-center gap-1 text-muted-foreground">
        <Check className="h-3 w-3 text-success flex-shrink-0" />
        EU AI Act Art. 50
      </span>
      <span className="hidden md:flex items-center gap-1 text-muted-foreground">
        <Check className="h-3 w-3 text-success flex-shrink-0" />
        NIS2
      </span>
    </div>
  );
}
