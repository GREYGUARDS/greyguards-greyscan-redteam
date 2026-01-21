import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface ServicesDropdownProps {
  compact?: boolean;
}

const ServicesDropdown = ({ compact = false }: ServicesDropdownProps) => {
  const services = {
    "Strategic Advisory & Training": {
      available: true,
      items: [
        "Counter-Narrative Strategy Workshop",
        "Grey Zone Communications Workshop",
        "Misinformation Table-Top Exercise",
        "Narrative Defence Playbook",
        "Ethical AI in Comms Advisory"
      ]
    },
    "Quick Start & Diagnostics": {
      available: true,
      items: [
        "Grey Zone Audit",
        "Narrative Monitoring Setup",
        "Brand Narrative Pulse",
        "Trend Momentum Analysis",
        "Competitor Narrative Benchmarking"
      ]
    },
    "Intelligence & Reporting": {
      available: false,
      items: [
        "Narrative Risk Report (Monthly)",
        "Narrative Landscape Mapping",
        "Bot & Persona Verification Report",
        "Narrative Health Index"
      ]
    },
    "Active Response & Influence": {
      available: true,
      items: [
        "Grey Zone Response Retainer",
        "Influencer Alignment Programme",
        "Elf Network Deployment",
        "Grey Zone Counter-Narrative Lab",
        "Digital Rapid Response Cell",
        "Creative Counter Communications Campaign",
        "Narrative Repair Campaign",
        "Narrative Defence & Disruption Retainer"
      ]
    },
    "Advanced Intelligence & Systems": {
      available: true,
      items: [
        "Narrative Simulation Lab",
        "Reputation Early Warning System",
        "Reputation Early Warning Feed (API)",
        "Synthetic Persona Detection Service",
        "Dark Web & Fringe Network Monitor",
        "Narrative Risk Index (SaaS)",
        "Custom Greyguards Integration for Agencies"
      ]
    },
    "Policy, Institutional & Global": {
      available: true,
      items: [
        "Election Integrity Monitoring",
        "Public Sector Narrative Resilience Programme",
        "Geo-Narrative Mapping",
        "International Narrative Risk Briefings",
        "Government / Institutional Programme"
      ]
    }
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(services).map(([tier, { available, items }], index) => (
          <AccordionItem key={tier} value={`tier-${index}`} className="border border-border/50 bg-secondary/30">
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-secondary/50">
              <div className="flex items-center gap-3">
                <span className={`font-bold uppercase tracking-wide ${compact ? 'text-xs' : 'text-sm'}`}>
                  {tier}
                </span>
                {available && (
                  <Badge variant="outline" className="text-[10px] font-medium bg-primary/10 text-primary border-primary/30">
                    AVAILABLE NOW
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="grid gap-1.5">
                {items.map((service) => (
                  <li key={service} className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 bg-primary/60 rounded-full flex-shrink-0" />
                    {service}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="text-center pt-2 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Contact us to discuss your requirements and receive a tailored proposal.
        </p>
      </div>
    </div>
  );
};

export default ServicesDropdown;