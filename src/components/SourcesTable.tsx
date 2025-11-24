import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, Clock, Globe, Newspaper, Users, TrendingUp, FileText, Radio } from "lucide-react";

interface Source {
  name: string;
  count: number;
  logo?: string;
  country?: string;
}

interface SourcesTableProps {
  sources: Source[];
}

const upcomingAPIs = [
  { name: "Twitter/X", icon: Users, type: "Social", description: "Real-time social sentiment" },
  { name: "Google News", icon: Newspaper, type: "News", description: "Global news aggregation" },
  { name: "Bing Search", icon: Globe, type: "Search", description: "Search engine mentions" },
  { name: "YouTube", icon: Radio, type: "Video", description: "Video content analysis" },
  { name: "LinkedIn", icon: Users, type: "Professional", description: "B2B network insights" },
  { name: "TikTok", icon: TrendingUp, type: "Social", description: "Viral content tracking" },
  { name: "Instagram", icon: Users, type: "Social", description: "Visual content monitoring" },
  { name: "Medium", icon: FileText, type: "Publishing", description: "Long-form content" },
];

const SourcesTable = ({ sources }: SourcesTableProps) => {
  const sortedSources = [...sources].sort((a, b) => b.count - a.count);
  const totalMentions = sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Intelligence Sources
          </span>
          <span className="text-sm text-success font-mono">{sources.length} / {sources.length + upcomingAPIs.length} Active</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Active Sources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Active Data Sources</h3>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              {totalMentions} Total Mentions
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedSources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-secondary border-2 border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-success/20 border-2 border-success/40 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{source.name}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs uppercase tracking-wider">
                        {getSourceType(source.name)}
                      </Badge>
                      {source.country && (
                        <span className="text-xs text-muted-foreground uppercase">{source.country}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-lg">{source.count}</div>
                  <div className="text-xs text-muted-foreground uppercase">Hits</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming APIs */}
        <div className="border-t-2 border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming Intelligence APIs</h3>
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
              Coming Soon
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {upcomingAPIs.map((api, index) => (
              <div
                key={index}
                className="flex flex-col p-3 bg-muted/30 border-2 border-dashed border-muted-foreground/20 opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-muted border border-muted-foreground/20 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate text-muted-foreground">{api.name}</div>
                    <Badge variant="outline" className="text-xs uppercase tracking-wider mt-1">
                      {api.type}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{api.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Bar */}
        <div className="pt-4 border-t-2 border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-success/10 border-2 border-success/30">
              <div className="text-2xl font-bold text-success">{sources.length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Active Sources</div>
            </div>
            <div className="p-3 bg-primary/10 border-2 border-primary/30">
              <div className="text-2xl font-bold text-primary">{totalMentions}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Mentions</div>
            </div>
            <div className="p-3 bg-muted border-2 border-border">
              <div className="text-2xl font-bold text-muted-foreground">{upcomingAPIs.length}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Coming Soon</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to determine source type
function getSourceType(sourceName: string): string {
  const name = sourceName.toLowerCase();
  
  if (name.includes('reddit') || name.includes('mastodon')) return 'Social';
  if (name.includes('hacker') || name.includes('tech')) return 'Tech';
  if (name.includes('wikipedia')) return 'Wiki';
  if (name.includes('gdelt')) return 'Global';
  if (name.includes('mail') || name.includes('news') || name.includes('times') || 
      name.includes('post') || name.includes('guardian') || name.includes('telegraph') ||
      name.includes('bbc') || name.includes('cnn') || name.includes('reuters') ||
      name.includes('bloomberg') || name.includes('financial')) return 'News';
  
  return 'RSS';
}

export default SourcesTable;
