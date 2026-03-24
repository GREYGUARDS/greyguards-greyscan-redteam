import { Shield, Check } from "lucide-react";

export function ComplianceBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card/95 backdrop-blur border border-border rounded-sm p-3 text-xs space-y-1.5 shadow-lg max-w-[220px]">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[10px] mb-2">
          <Shield className="h-3 w-3" />
          System Compliance
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-success flex-shrink-0" />
          <span className="text-muted-foreground">EU AI Act Article 50 — <span className="text-foreground font-medium">Monitoring Active</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="h-3 w-3 text-success flex-shrink-0" />
          <span className="text-muted-foreground">NIS2 — <span className="text-foreground font-medium">Compliant</span></span>
        </div>
        <div className="border-t border-border mt-2 pt-1.5">
          <span className="text-muted-foreground text-[10px]">Audit log: available on request</span>
        </div>
      </div>
    </div>
  );
}
