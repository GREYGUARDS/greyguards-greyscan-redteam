import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";

interface Mention {
  text: string;
  source: string;
  date: Date;
  score?: number;
}

interface MentionsTickerProps {
  mentions: Mention[];
  brandName: string;
}

export function MentionsTicker({ mentions, brandName }: MentionsTickerProps) {
  const tickerRef = useRef<HTMLDivElement>(null);

  const highlightBrand = (text: string) => {
    if (!brandName) return text;
    
    const regex = new RegExp(`(${brandName})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (part.toLowerCase() === brandName.toLowerCase()) {
        return (
          <span key={index} className="bg-primary text-primary-foreground px-1 font-bold">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const ticker = tickerRef.current;
    if (!ticker) return;

    const scrollWidth = ticker.scrollWidth;
    const clientWidth = ticker.clientWidth;
    
    if (scrollWidth <= clientWidth) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5; // pixels per frame

    const animate = () => {
      scrollPosition += speed;
      
      if (scrollPosition >= scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      ticker.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mentions]);

  if (!mentions || mentions.length === 0) {
    return null;
  }

  const getSourceColor = (source: string) => {
    switch (source.toLowerCase()) {
      case "news":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "reddit":
        return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  // Duplicate mentions for seamless infinite scroll
  const duplicatedMentions = [...mentions, ...mentions];

  return (
    <Card className="animate-fade-in border-4 border-border">
      <CardHeader className="border-b-4 border-border bg-secondary">
        <CardTitle className="uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Data Stream
        </CardTitle>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Real-time mention monitoring
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden">
          <div
            ref={tickerRef}
            className="flex gap-4 overflow-x-hidden whitespace-nowrap"
            style={{ scrollBehavior: "auto" }}
          >
            {duplicatedMentions.map((mention, index) => (
              <div
                key={index}
                className="inline-flex flex-shrink-0 items-start gap-3 p-4 border-2 border-border bg-card min-w-[280px] sm:min-w-[400px] max-w-[500px]"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`uppercase text-xs ${getSourceColor(mention.source)}`}
                    >
                      {mention.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(() => {
                        try {
                          const date = new Date(mention.date);
                          if (isNaN(date.getTime())) {
                            return 'Recently';
                          }
                          return formatDistanceToNow(date, { addSuffix: true });
                        } catch {
                          return 'Recently';
                        }
                      })()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-normal line-clamp-3 leading-relaxed">
                    {highlightBrand(mention.text)}
                  </p>
                  {mention.score && mention.score > 10 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Engagement:</span>
                      <Badge variant="secondary" className="text-xs">
                        {mention.score}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Fade edges for better visual effect */}
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </CardContent>
    </Card>
  );
}
