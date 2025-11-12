import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Location {
  name: string;
  count: number;
  lat?: number;
  lon?: number;
}

interface GDELTLocationsMapProps {
  locations: Location[];
}

export function GDELTLocationsMap({ locations }: GDELTLocationsMapProps) {
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Geographic Mentions (GDELT)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map((location, index) => (
            <div 
              key={index} 
              className="border-2 border-border p-3 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold truncate uppercase">
                    {location.name}
                  </p>
                  {location.lat && location.lon && (
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                    </p>
                  )}
                </div>
                <Badge 
                  variant="secondary"
                  className="shrink-0 font-mono border-2 border-border"
                >
                  {location.count}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center uppercase tracking-widest">
          Top Geographic Locations Mentioned // GDELT Global Coverage
        </p>
      </CardContent>
    </Card>
  );
}
