import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Database, 
  Loader2,
  MessageSquare,
  Newspaper,
  Globe,
  Code,
  TrendingUp,
  Users
} from "lucide-react";

export interface APIStatus {
  name: string;
  status: 'success' | 'failed' | 'loading' | 'pending';
  count: number;
  type: 'social' | 'news' | 'tech' | 'global' | 'search';
  hasComments?: boolean;
}

interface APIStatusPanelProps {
  apiStatuses: APIStatus[];
  isLoading?: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  social: Users,
  news: Newspaper,
  tech: Code,
  global: Globe,
  search: TrendingUp,
};

const typeColors: Record<string, string> = {
  social: 'text-primary',
  news: 'text-warning',
  tech: 'text-accent-foreground',
  global: 'text-success',
  search: 'text-muted-foreground',
};

export const APIStatusPanel = ({ apiStatuses, isLoading }: APIStatusPanelProps) => {
  const successCount = apiStatuses.filter(api => api.status === 'success').length;
  const failedCount = apiStatuses.filter(api => api.status === 'failed').length;
  const loadingCount = apiStatuses.filter(api => api.status === 'loading').length;
  const totalMentions = apiStatuses.reduce((sum, api) => sum + api.count, 0);
  const sourcesWithComments = apiStatuses.filter(api => api.hasComments && api.status === 'success').length;

  const sortedStatuses = [...apiStatuses].sort((a, b) => {
    const statusOrder = { loading: 0, success: 1, failed: 2, pending: 3 };
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return b.count - a.count;
  });

  const getStatusIcon = (status: APIStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted-foreground/30 flex-shrink-0" />;
    }
  };

  const getStatusBg = (status: APIStatus['status']) => {
    switch (status) {
      case 'success':
        return 'bg-muted/50 border-success/40';
      case 'failed':
        return 'bg-muted/50 border-destructive/40';
      case 'loading':
        return 'bg-muted/50 border-primary/40';
      default:
        return 'bg-muted/30 border-border';
    }
  };

  return (
    <Card className="border border-border bg-secondary/50">
      <CardHeader className="border-b border-border py-4 bg-muted/30">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 uppercase tracking-wider text-base">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 flex-shrink-0" />
            <span>API Status</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
            {loadingCount > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 animate-pulse whitespace-nowrap">
                <Loader2 className="h-3 w-3 animate-spin mr-1.5 flex-shrink-0" />
                <span>{loadingCount} Loading</span>
              </Badge>
            )}
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 whitespace-nowrap">
              <span>{successCount} Connected</span>
            </Badge>
            {failedCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 whitespace-nowrap">
                <span>{failedCount} Failed</span>
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4 bg-secondary/30">
        {/* Progress Bar */}
        {loadingCount > 0 && (
          <div className="space-y-2 p-3 bg-muted/40 border border-border">
            <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
              <span>Fetching data sources...</span>
              <span className="font-mono">{successCount + failedCount} / {apiStatuses.length}</span>
            </div>
            <div className="h-2 bg-background border border-border overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((successCount + failedCount) / apiStatuses.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-muted/40 border border-success/30 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-success font-mono">{successCount}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground text-center mt-1">Active APIs</div>
          </div>
          <div className="p-4 bg-muted/40 border border-primary/30 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-primary font-mono">{totalMentions.toLocaleString()}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground text-center mt-1">Total Hits</div>
          </div>
          <div className="p-4 bg-muted/40 border border-accent/30 flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-foreground font-mono">{sourcesWithComments}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground text-center mt-1">With Comments</div>
          </div>
          <div className="p-4 bg-muted/40 border border-border flex flex-col items-center justify-center">
            <div className="text-2xl font-bold text-muted-foreground font-mono">{apiStatuses.length}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground text-center mt-1">Total APIs</div>
          </div>
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {sortedStatuses.map((api, index) => {
            const TypeIcon = typeIcons[api.type] || Globe;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 border transition-all ${getStatusBg(api.status)}`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {getStatusIcon(api.status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm truncate">{api.name}</span>
                    {api.hasComments && (
                      <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TypeIcon className={`h-3 w-3 flex-shrink-0 ${typeColors[api.type]}`} />
                    <span className="text-xs text-muted-foreground uppercase truncate">{api.type}</span>
                  </div>
                </div>
                
                {/* Count */}
                <div className="flex-shrink-0 text-right">
                  <span className={`font-mono font-bold text-sm ${api.status === 'success' && api.count > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {api.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3 w-3 text-destructive flex-shrink-0" />
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span>Has Comments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 text-primary flex-shrink-0" />
            <span>Loading</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIStatusPanel;
