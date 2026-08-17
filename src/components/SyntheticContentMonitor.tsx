import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Video, Mic, Image, FileText, Globe } from "lucide-react";

interface DetectionCapability {
  id: string;
  assetType: string;
  icon: JSX.Element;
  looksFor: string;
  signals: string[];
}

interface SyntheticContentMonitorProps {
  brandName: string;
}

export function SyntheticContentMonitor({ brandName }: SyntheticContentMonitorProps) {
  const label = brandName || "the organisation";

  const capabilities: DetectionCapability[] = [
    {
      id: "sc-video",
      assetType: "Video",
      icon: <Video className="h-4 w-4" />,
      looksFor: `Deepfake or face-swapped footage of ${label} executives and spokespeople`,
      signals: ["Facial warping", "Lip-sync drift", "Frame artefacts"],
    },
    {
      id: "sc-audio",
      assetType: "Audio",
      icon: <Mic className="h-4 w-4" />,
      looksFor: `Cloned voices impersonating ${label} leadership on calls, clips or leaked "recordings"`,
      signals: ["Voice-clone spectra", "Unnatural prosody", "Splice points"],
    },
    {
      id: "sc-image",
      assetType: "Image",
      icon: <Image className="h-4 w-4" />,
      looksFor: `Fabricated or edited imagery of ${label} sites, products, documents and incidents`,
      signals: ["Generative fingerprints", "Metadata mismatch", "Clone-stamp traces"],
    },
    {
      id: "sc-text",
      assetType: "Text",
      icon: <FileText className="h-4 w-4" />,
      looksFor: `AI-written press releases, statements and reviews falsely attributed to ${label}`,
      signals: ["Model stylometry", "Template reuse", "Coordinated phrasing"],
    },
    {
      id: "sc-network",
      assetType: "Network",
      icon: <Globe className="h-4 w-4" />,
      looksFor: `Inauthentic accounts and cloned domains amplifying synthetic ${label} content`,
      signals: ["Burst posting", "Account age clusters", "Look-alike domains"],
    },
  ];

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2 uppercase">
            <Eye className="h-4 w-4 flex-shrink-0" />
            Synthetic Content Monitor
          </CardTitle>
          <Badge variant="outline" className="text-xs uppercase tracking-wider bg-warning/10 text-warning border-warning/30">
            In Development
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Detection coverage roadmap — no live scanning is running yet. The categories below show what
          this module will monitor for once detection sources are connected.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Type</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">What It Will Look For</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Detection Signals</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.map((cap) => (
                <tr key={cap.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {cap.icon}
                      <span className="font-medium">{cap.assetType}</span>
                    </div>
                  </td>
                  <td className="p-3 max-w-md">
                    <span className="text-xs text-muted-foreground">{cap.looksFor}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {cap.signals.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] text-muted-foreground border-border">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-xs uppercase tracking-wider bg-warning/10 text-warning border-warning/30">
                      In Development
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
