import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StrategicRecommendationsProps {
  brandName: string;
  topTopics: string;
  sentimentSummary: string;
  riskLevel: string;
}

const StrategicRecommendations = ({
  brandName,
  topTopics,
  sentimentSummary,
  riskLevel,
}: StrategicRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke(
          "generate-strategic-recommendations",
          {
            body: {
              brand: brandName,
              topTopics,
              sentimentSummary,
              riskLevel,
            },
          }
        );

        if (error) {
          console.error("Error generating recommendations:", error);
          toast({
            title: "Error",
            description: "Failed to generate strategic recommendations",
            variant: "destructive",
          });
          return;
        }

        setRecommendations(data.recommendations);
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Failed to generate recommendations",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [brandName, topTopics, sentimentSummary, riskLevel, toast]);

  return (
    <Card className="border-4 border-border bg-card">
      <CardHeader className="border-b-4 border-border">
        <CardTitle className="flex items-center gap-2 uppercase tracking-wider">
          <Lightbulb className="h-5 w-5" />
          AI Strategic Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Generating strategic recommendations...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-sm border-2 border-border">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {recommendations}
              </p>
            </div>
            <div className="pt-4 border-t-2 border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                808080 Services Available
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-card border-2 border-border p-3 rounded-sm">
                  <p className="text-xs font-semibold uppercase">Grey Zone Audit</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comprehensive narrative analysis
                  </p>
                </div>
                <div className="bg-card border-2 border-border p-3 rounded-sm">
                  <p className="text-xs font-semibold uppercase">Narrative Monitoring</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    24/7 threat detection
                  </p>
                </div>
                <div className="bg-card border-2 border-border p-3 rounded-sm">
                  <p className="text-xs font-semibold uppercase">Counter-Narrative Strategy</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defensive positioning
                  </p>
                </div>
                <div className="bg-card border-2 border-border p-3 rounded-sm">
                  <p className="text-xs font-semibold uppercase">Influencer Engagement</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Strategic amplification
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategicRecommendations;
