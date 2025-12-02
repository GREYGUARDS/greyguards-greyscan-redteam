import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tags } from "lucide-react";

interface GDELTThemesChartProps {
  data: { name: string; count: number }[];
}

export function GDELTThemesChart({ data }: GDELTThemesChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Transform data for treemap - add size and color based on count
  const treemapData = data.map((item, index) => ({
    name: item.name,
    size: item.count,
    fill: `hsl(var(--primary) / ${0.3 + (item.count / Math.max(...data.map(d => d.count))) * 0.7})`,
  }));

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size } = props;
    
    // Guard against undefined values
    if (!name || !width || !height) return null;
    
    // Only show text if the box is large enough
    const showText = width > 60 && height > 30;
    const displayName = String(name);
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: props.fill,
            stroke: "hsl(var(--border))",
            strokeWidth: 2,
          }}
        />
        {showText && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 6}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
              fontSize={10}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {displayName.length > 20 ? displayName.substring(0, 18) + "..." : displayName}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize={9}
              fontFamily="monospace"
            >
              {size}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Tags className="h-5 w-5" />
          GDELT Theme Clustering ({data.length} themes)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="hsl(var(--border))"
            content={<CustomContent />}
          >
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "2px solid hsl(var(--border))",
                borderRadius: "0",
                fontFamily: "monospace",
              }}
              formatter={(value: any, name: any, props: any) => [
                `${value} mentions`,
                props.payload.name,
              ]}
            />
          </Treemap>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground mt-4 text-center uppercase tracking-widest">
          GDELT's 2,300+ Automated Theme Detection // Global Knowledge Graph
        </p>
      </CardContent>
    </Card>
  );
}
