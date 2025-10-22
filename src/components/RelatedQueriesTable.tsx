import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { pipeline } from "@huggingface/transformers";
import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface RelatedQueriesTableProps {
  data: { query: string; value: number | string }[];
}

interface QueryWithSentiment {
  query: string;
  value: number | string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
}

export function RelatedQueriesTable({ data }: RelatedQueriesTableProps) {
  const [queriesWithSentiment, setQueriesWithSentiment] = useState<QueryWithSentiment[]>([]);
  const [negativePercentage, setNegativePercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyzeQueries = async () => {
      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const sentimentPipeline = await pipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
        );

        const analyzed = await Promise.all(
          data.map(async (item) => {
            try {
              const result = await sentimentPipeline(item.query.slice(0, 512)) as any;
              const output = Array.isArray(result) ? result[0] : result;
              const sentiment = output.label?.toLowerCase() as "positive" | "negative";
              return {
                ...item,
                sentiment,
                score: output.score || 0.5,
              };
            } catch (error) {
              return {
                ...item,
                sentiment: "neutral" as const,
                score: 0.5,
              };
            }
          })
        );

        setQueriesWithSentiment(analyzed);
        
        const negativeCount = analyzed.filter(q => q.sentiment === "negative").length;
        setNegativePercentage(Math.round((negativeCount / analyzed.length) * 100));
      } catch (error) {
        console.error("Error analyzing sentiment:", error);
        setQueriesWithSentiment(data.map(item => ({
          ...item,
          sentiment: "neutral" as const,
          score: 0.5,
        })));
      } finally {
        setLoading(false);
      }
    };

    analyzeQueries();
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getSentimentBadgeVariant = (sentiment: string): "default" | "secondary" | "destructive" => {
    switch (sentiment) {
      case "negative":
        return "destructive";
      case "positive":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trending Associated Topics</CardTitle>
          {!loading && negativePercentage > 0 && (
            <Badge variant={negativePercentage > 50 ? "destructive" : "secondary"} className="flex items-center gap-1">
              {negativePercentage > 50 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {negativePercentage}% Negative
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Analyzing sentiment...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Query</TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead className="text-right">Search Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queriesWithSentiment.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.query}</TableCell>
                  <TableCell>
                    <Badge variant={getSentimentBadgeVariant(item.sentiment)} className="capitalize">
                      {item.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{item.value}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
