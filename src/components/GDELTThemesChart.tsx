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

  // Wrap a theme label across up to `maxLines` lines, always breaking on word
  // boundaries (GDELT themes are underscore-separated words). Only if a whole
  // word still cannot fit do we drop remaining words and mark the label with
  // an ellipsis — never a mid-word cut.
  const wrapLabel = (label: string, width: number, fontSize: number, maxLines: number) => {
    const charWidth = fontSize * 0.62;
    const maxChars = Math.max(4, Math.floor((width - 8) / charWidth));
    const words = label.split(/[_\s]+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      if (lines.length === maxLines) {
        return { lines, truncated: true };
      }
      current = word;
    }
    if (current) lines.push(current);

    const truncated = lines.length > maxLines;
    return { lines: lines.slice(0, maxLines), truncated };
  };

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size } = props;

    // Guard against undefined values
    if (!name || !width || !height) return null;

    const displayName = String(name);
    const showText = width > 50 && height > 25;
    const fontSize = 9;
    const maxLines = Math.max(1, Math.min(3, Math.floor((height - 16) / 11)));
    const { lines, truncated } = wrapLabel(displayName, width, fontSize, maxLines);
    const blockHeight = lines.length * 11 + 10;
    const startY = y + height / 2 - blockHeight / 2 + 9;

    return (
      <g>
        {/* Native SVG tooltip: works on hover and on tap-and-hold, so the full
            label and count are always reachable even in the smallest tiles. */}
        <title>{`${displayName.replace(/_/g, " ")} — ${size} mentions`}</title>
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
            {lines.map((line, i) => (
              <text
                key={i}
                x={x + width / 2}
                y={startY + i * 11}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize={fontSize}
                fontWeight="500"
              >
                {line}
                {truncated && i === lines.length - 1 ? "…" : ""}
              </text>
            ))}
            <text
              x={x + width / 2}
              y={startY + lines.length * 11 + 1}
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
