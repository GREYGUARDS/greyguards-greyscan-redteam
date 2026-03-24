import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Video, Mic, Image, FileText } from "lucide-react";

interface FlaggedAsset {
  id: string;
  assetType: "Video" | "Audio" | "Image" | "Text";
  description: string;
  confidenceScore: number;
  attribution: "AI-Generated" | "AI-Manipulated" | "Human-Verified";
  status: "Flagged" | "Under Analysis" | "Cleared";
}

const getAssetIcon = (type: string) => {
  switch (type) {
    case "Video": return <Video className="h-4 w-4" />;
    case "Audio": return <Mic className="h-4 w-4" />;
    case "Image": return <Image className="h-4 w-4" />;
    case "Text": return <FileText className="h-4 w-4" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Flagged": return "bg-destructive/20 text-destructive border-destructive/30";
    case "Under Analysis": return "bg-warning/20 text-warning border-warning/30";
    case "Cleared": return "bg-success/20 text-success border-success/30";
    default: return "";
  }
};

const getAttributionColor = (attr: string) => {
  switch (attr) {
    case "AI-Generated": return "bg-destructive/10 text-destructive border-destructive/20";
    case "AI-Manipulated": return "bg-warning/10 text-warning border-warning/20";
    case "Human-Verified": return "bg-success/10 text-success border-success/20";
    default: return "";
  }
};

interface SyntheticContentMonitorProps {
  brandName: string;
}

export function SyntheticContentMonitor({ brandName }: SyntheticContentMonitorProps) {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const flaggedAssets: FlaggedAsset[] = [
    {
      id: "sc-001",
      assetType: "Video",
      description: `Deepfake video of ${brandName} CEO making fabricated statements about product safety recalls`,
      confidenceScore: 94.2,
      attribution: "AI-Generated",
      status: "Flagged",
    },
    {
      id: "sc-002",
      assetType: "Audio",
      description: `Synthetic voice recording purporting to be internal ${brandName} board meeting discussing illegal activities`,
      confidenceScore: 87.6,
      attribution: "AI-Generated",
      status: "Under Analysis",
    },
    {
      id: "sc-003",
      assetType: "Image",
      description: `Manipulated photograph showing ${brandName} facilities with fabricated environmental violations`,
      confidenceScore: 91.3,
      attribution: "AI-Manipulated",
      status: "Flagged",
    },
    {
      id: "sc-004",
      assetType: "Text",
      description: `AI-generated press release falsely attributed to ${brandName} communications department`,
      confidenceScore: 78.9,
      attribution: "AI-Generated",
      status: "Under Analysis",
    },
    {
      id: "sc-005",
      assetType: "Image",
      description: `Verified authentic photograph from ${brandName} annual report — no manipulation detected`,
      confidenceScore: 12.1,
      attribution: "Human-Verified",
      status: "Cleared",
    },
  ];

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2 uppercase">
            <Eye className="h-4 w-4 flex-shrink-0" />
            Synthetic Content Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Asset Type</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Confidence</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Attribution</th>
                <th className="text-center p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {flaggedAssets.map((asset) => (
                <tr key={asset.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {getAssetIcon(asset.assetType)}
                      <span className="font-medium">{asset.assetType}</span>
                    </div>
                  </td>
                  <td className="p-3 max-w-md">
                    <span className="text-xs text-muted-foreground">{asset.description}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`font-mono font-bold text-sm ${asset.confidenceScore > 80 ? 'text-destructive' : asset.confidenceScore > 50 ? 'text-warning' : 'text-success'}`}>
                      {asset.confidenceScore}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className={`text-xs ${getAttributionColor(asset.attribution)}`}>
                      {asset.attribution}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline" className={`text-xs ${getStatusColor(asset.status)}`}>
                      {asset.status}
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
