import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";

interface GDELTEntitiesChartProps {
  data: { name: string; count: number }[];
}

export function GDELTEntitiesChart({ data }: GDELTEntitiesChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Network className="h-5 w-5" />
          Co-Mentioned Entities (GDELT)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="5 5" stroke="hsl(var(--border))" strokeWidth={1} />
            <XAxis 
              type="number"
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="hsl(var(--foreground))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "monospace", fontSize: 10 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              width={150}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "2px solid hsl(var(--border))",
                borderRadius: "0",
                fontFamily: "monospace"
              }} 
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))"
              strokeWidth={2}
              stroke="hsl(var(--border))"
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4 text-center uppercase tracking-widest">
          Top Entities Co-Mentioned with Brand // GDELT Global Knowledge Graph
        </p>
      </CardContent>
    </Card>
  );
}
