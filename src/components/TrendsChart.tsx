import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TrendsChartProps {
  data: { date: string; value: number }[];
}

export function TrendsChart({ data }: TrendsChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Search Interest Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="5 5" stroke="hsl(var(--border))" strokeWidth={1} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "2px solid hsl(var(--border))",
                borderRadius: "0",
                fontFamily: "monospace"
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4 text-center uppercase tracking-widest">
          Google Trends Data // Normalized 0-100 Scale
        </p>
      </CardContent>
    </Card>
  );
}
