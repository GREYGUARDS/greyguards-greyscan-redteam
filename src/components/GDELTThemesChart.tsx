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
    const showText = width > 50 && height > 25;
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
            strokeWidth: 1,
          }}
        />
        {showText && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 5}
              textAnchor="middle"
              fill="hsl(var(--foreground))"
              fontSize={9}
              fontWeight="500"
            >
              {displayName.length > 15 ? displayName.substring(0, 13) + "..." : displayName}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 8}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize={8}
            >
              {size}
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <Card className="border border-border">
      <CardHeader className="border-b border-border bg-secondary/50 py-3 px-4 sm:px-6">
        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
          <Tags className="h-4 w-4" />
          <span className="truncate">Theme Analysis ({data.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={300}>
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
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: any, props: any) => [
                  `${value} mentions`,
                  props.payload.name,
                ]}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          GDELT Theme Detection • Global Knowledge Graph
        </p>
      </CardContent>
    </Card>
  );
}
