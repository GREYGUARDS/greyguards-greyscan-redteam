import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                Greyguards Intelligence Solutions
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                {/* Tier 1: Quick Start / Diagnostics */}
                <AccordionItem value="tier-1" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Quick Start / Diagnostics</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Grey Zone Audit</p>
                        <p className="text-xs text-muted-foreground mt-1">Diagnostic of brand exposure to misinformation, sentiment, and narrative risk</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Monitoring Setup</p>
                        <p className="text-xs text-muted-foreground mt-1">Configure automated monitoring dashboards, alerts, and sentiment feeds</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Brand Narrative Pulse</p>
                        <p className="text-xs text-muted-foreground mt-1">Weekly scan of brand mentions, tone, and risk trend visualised in a micro-report</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Trend Momentum Analysis</p>
                        <p className="text-xs text-muted-foreground mt-1">Detect emerging narratives before they peak using velocity and engagement metrics</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Competitor Narrative Benchmarking</p>
                        <p className="text-xs text-muted-foreground mt-1">Compare sentiment and narrative strength of up to 5 competitors</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tier 2: Intelligence & Reporting */}
                <AccordionItem value="tier-2" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Intelligence & Reporting</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Risk Report</p>
                        <p className="text-xs text-muted-foreground mt-1">Monthly intelligence summary and data visualisation</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Landscape Mapping</p>
                        <p className="text-xs text-muted-foreground mt-1">Visual network map of topics, actors, and sentiment flows</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Bot & Persona Verification Report</p>
                        <p className="text-xs text-muted-foreground mt-1">Detect fake or coordinated accounts driving narratives</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Health Index</p>
                        <p className="text-xs text-muted-foreground mt-1">Quarterly index measuring brand narrative resilience over time</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tier 3: Strategic Advisory & Training */}
                <AccordionItem value="tier-3" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Strategic Advisory & Training</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Counter-Narrative Strategy Workshop</p>
                        <p className="text-xs text-muted-foreground mt-1">Interactive session to design proactive & reactive messaging frameworks</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Grey Zone Communications Workshop</p>
                        <p className="text-xs text-muted-foreground mt-1">Teach comms teams how to identify, verify, and counter influence operations</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Misinformation Table-Top Exercise</p>
                        <p className="text-xs text-muted-foreground mt-1">Crisis simulation testing team readiness for D/M/M information attacks</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Defence Playbook</p>
                        <p className="text-xs text-muted-foreground mt-1">Tailored manual detailing detection, verification, and engagement protocols</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Ethical AI in Comms Advisory</p>
                        <p className="text-xs text-muted-foreground mt-1">Guidance on responsible AI use in public-facing communications</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tier 4: Active Response & Influence */}
                <AccordionItem value="tier-4" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Active Response & Influence</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Grey Zone Response Retainer</p>
                        <p className="text-xs text-muted-foreground mt-1">On-call crisis advisory for misinformation events</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Influencer Alignment Programme</p>
                        <p className="text-xs text-muted-foreground mt-1">Identify and brief credible voices aligned with brand values</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Elf Network Deployment</p>
                        <p className="text-xs text-muted-foreground mt-1">Ethical human responders counter false narratives transparently</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Grey Zone Counter-Narrative Lab</p>
                        <p className="text-xs text-muted-foreground mt-1">Co-create factual, creative counter-messaging campaigns</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Digital Rapid Response Cell</p>
                        <p className="text-xs text-muted-foreground mt-1">24/7 hybrid AI + human monitoring and response capability</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Repair Campaign</p>
                        <p className="text-xs text-muted-foreground mt-1">Strategic content and media plan to restore trust post-crisis</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tier 5: Advanced Intelligence & Systems */}
                <AccordionItem value="tier-5" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Advanced Intelligence & Systems</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Simulation Lab</p>
                        <p className="text-xs text-muted-foreground mt-1">AI + human "red-team" testing how communications or policies might be distorted online</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Reputation Early Warning System</p>
                        <p className="text-xs text-muted-foreground mt-1">Real-time monitoring dashboard integrating social, news & dark-web feeds</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Reputation Early Warning Feed (API)</p>
                        <p className="text-xs text-muted-foreground mt-1">Data feed or Slack integration delivering ongoing risk alerts</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Synthetic Persona Detection Service</p>
                        <p className="text-xs text-muted-foreground mt-1">Identify AI-generated fake online personalities and coordinated FOPs</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Dark Web & Fringe Network Monitor</p>
                        <p className="text-xs text-muted-foreground mt-1">Track off-platform narrative activity and early-stage misinformation clusters</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Narrative Risk Index (SaaS)</p>
                        <p className="text-xs text-muted-foreground mt-1">Subscription analytics product scoring narrative risk by sector</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Custom 808080 Integration</p>
                        <p className="text-xs text-muted-foreground mt-1">Embed 808080 capabilities within agency dashboards or reporting</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tier 6: Policy, Institutional & Global Engagement */}
                <AccordionItem value="tier-6" className="border-2 border-border">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <span className="text-xs font-bold uppercase tracking-wide">Policy, Institutional & Global</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-2">
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Election Integrity Monitoring</p>
                        <p className="text-xs text-muted-foreground mt-1">Track influence operations & misinformation around election cycles</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Public Sector Narrative Resilience Programme</p>
                        <p className="text-xs text-muted-foreground mt-1">Train government comms teams in detection & counter-influence</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Geo-Narrative Mapping</p>
                        <p className="text-xs text-muted-foreground mt-1">Regional or geopolitical mapping of cross-border narrative influence</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">International Narrative Risk Briefings</p>
                        <p className="text-xs text-muted-foreground mt-1">Periodic intelligence briefings for embassies, IGOs, NGOs</p>
                      </div>
                      <div className="bg-card border-2 border-border p-3 rounded-sm">
                        <p className="text-xs font-semibold uppercase">Government / Institutional Programme</p>
                        <p className="text-xs text-muted-foreground mt-1">End-to-end narrative-defence ecosystem build with training & tech stack</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StrategicRecommendations;
