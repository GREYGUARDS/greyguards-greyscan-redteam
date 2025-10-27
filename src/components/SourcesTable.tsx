import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2 } from "lucide-react";

interface Source {
  name: string;
  count: number;
  logo?: string;
  country?: string;
}

interface SourcesTableProps {
  sources: Source[];
}

const SourcesTable = ({ sources }: SourcesTableProps) => {
  // Sort by count descending
  const sortedSources = [...sources].sort((a, b) => b.count - a.count);

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <Database className="h-5 w-5" />
          Data Sources ({sources.length} Active)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
          Intelligence gathered from {sources.reduce((sum, s) => sum + s.count, 0)} mentions across {sources.length} verified sources
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-border">
                <TableHead className="uppercase tracking-wider text-xs">Source</TableHead>
                <TableHead className="uppercase tracking-wider text-xs">Type</TableHead>
                <TableHead className="uppercase tracking-wider text-xs text-right">Mentions</TableHead>
                <TableHead className="uppercase tracking-wider text-xs text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSources.map((source, index) => (
                <TableRow key={index} className="border-b border-border">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-secondary border-2 border-border flex items-center justify-center text-xs font-bold uppercase">
                        {source.name.substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold">{source.name}</div>
                        {source.country && (
                          <div className="text-xs text-muted-foreground uppercase tracking-wider">
                            {source.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="uppercase tracking-wider text-xs">
                      {getSourceType(source.name)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {source.count}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 p-4 bg-secondary border-2 border-border rounded-sm">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            <span className="font-semibold text-foreground">Sources Legend:</span> News (Press), Social (Community), Tech (Forums), Wiki (Reference), RSS (Aggregated)
          </p>
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
  if (name.includes('mail') || name.includes('news') || name.includes('times') || 
      name.includes('post') || name.includes('guardian') || name.includes('telegraph') ||
      name.includes('bbc') || name.includes('cnn') || name.includes('reuters') ||
      name.includes('bloomberg') || name.includes('financial')) return 'News';
  
  return 'RSS';
}

export default SourcesTable;
