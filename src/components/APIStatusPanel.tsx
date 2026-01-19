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
    // Sort by status: loading first (to show progress), then success, then failed
    const statusOrder = { loading: 0, success: 1, failed: 2, pending: 3 };
    const orderDiff = statusOrder[a.status] - statusOrder[b.status];
    if (orderDiff !== 0) return orderDiff;
    return b.count - a.count;
  });

  const getStatusIcon = (status: APIStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted-foreground/30" />;
    }
  };

  const getStatusBg = (status: APIStatus['status']) => {
    switch (status) {
      case 'success':
        return 'bg-success/10 border-success/30';
      case 'failed':
        return 'bg-destructive/10 border-destructive/30';
      case 'loading':
        return 'bg-primary/10 border-primary/30';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border py-4">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API Status
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </span>
          <div className="flex items-center gap-2 text-sm font-mono">
            {loadingCount > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                {loadingCount} Loading
              </Badge>
            )}
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              {successCount} Connected
            </Badge>
            {failedCount > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                {failedCount} Failed
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Progress Bar - only show while loading */}
        {loadingCount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
              <span>Fetching data sources...</span>
              <span>{successCount + failedCount} / {apiStatuses.length} complete</span>
            </div>
            <div className="h-2 bg-muted border border-border overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${((successCount + failedCount) / apiStatuses.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-success/10 border-2 border-success/30 text-center">
            <div className="text-xl font-bold text-success font-mono">{successCount}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Active APIs</div>
          </div>
          <div className="p-3 bg-primary/10 border-2 border-primary/30 text-center">
            <div className="text-xl font-bold text-primary font-mono">{totalMentions.toLocaleString()}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total Hits</div>
          </div>
          <div className="p-3 border-2 border-accent/30 bg-accent/10 text-center">
            <div className="text-xl font-bold text-accent-foreground font-mono">{sourcesWithComments}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">With Comments</div>
          </div>
          <div className="p-3 bg-muted border-2 border-border text-center">
            <div className="text-xl font-bold text-muted-foreground font-mono">{apiStatuses.length}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Total APIs</div>
          </div>
        </div>

        {/* API Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {sortedStatuses.map((api, index) => {
            const TypeIcon = typeIcons[api.type] || Globe;
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-2.5 border-2 transition-all ${getStatusBg(api.status)}`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getStatusIcon(api.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm truncate">{api.name}</span>
                      {api.hasComments && (
                        <MessageSquare className="h-3 w-3 text-accent-foreground flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <TypeIcon className={`h-3 w-3 ${typeColors[api.type]}`} />
                      <span className="text-xs text-muted-foreground uppercase">{api.type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right pl-2">
                  <div className={`font-mono font-bold ${api.status === 'success' && api.count > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    {api.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 border-t-2 border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-success" />
            <span>Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            <span>Failed</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-accent-foreground" />
            <span>Has Comments</span>
          </div>
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 text-primary" />
            <span>Loading</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIStatusPanel;
