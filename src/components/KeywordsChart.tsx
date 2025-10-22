import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash } from "lucide-react";

interface KeywordsChartProps {
  data: { word: string; count: number }[];
}

export function KeywordsChart({ data }: KeywordsChartProps) {
  return (
    <Card className="border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Hash className="h-5 w-5" />
          Keyword Frequency Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="5 5" stroke="hsl(var(--border))" strokeWidth={1} />
            <XAxis 
              type="number" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              dataKey="word" 
              type="category" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "2px solid hsl(var(--border))",
                borderRadius: "0",
                fontFamily: "monospace"
              }} 
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" stroke="hsl(var(--border))" strokeWidth={2} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
