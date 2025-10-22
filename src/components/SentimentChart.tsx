import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface SentimentChartProps {
  data: { name: string; value: number; fill: string }[];
}

export function SentimentChart({ data }: SentimentChartProps) {
  return (
    <Card className="border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--border))"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "2px solid hsl(var(--border))",
                borderRadius: "0"
              }} 
            />
            <Legend 
              wrapperStyle={{
                fontFamily: "monospace",
                fontSize: "12px",
                textTransform: "uppercase",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
