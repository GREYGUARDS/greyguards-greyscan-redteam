import { useState } from "react";
import { Play, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DEMO_COMPANY_LIST, DEMO_COMPANIES } from "@/lib/demoData";

interface DemoModeSelectorProps {
  onSelectCompany: (companyName: string) => void;
  isActive: boolean;
  currentCompany?: string;
}

export const DemoModeSelector = ({ 
  onSelectCompany, 
  isActive, 
  currentCompany 
}: DemoModeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {isActive && (
        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50 uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3 w-3 mr-1" />
          Demo Mode
        </Badge>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={isActive ? "default" : "outline"} 
            size="sm" 
            className="uppercase tracking-wider gap-2"
          >
            <Play className="h-4 w-4" />
            {isActive ? currentCompany || "Demo" : "Demo Mode"}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-card border-2 border-border z-50"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Select Demo Company
            </p>
          </div>
          {DEMO_COMPANY_LIST.map((company) => {
            const data = DEMO_COMPANIES[company];
            const threatColors: Record<string, string> = {
              low: "text-success",
              moderate: "text-warning",
              elevated: "text-warning",
              high: "text-destructive",
              critical: "text-destructive"
            };
            
            return (
              <DropdownMenuItem
                key={company}
                onClick={() => {
                  onSelectCompany(company);
                  setIsOpen(false);
                }}
                className="flex flex-col items-start gap-1 cursor-pointer py-3"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{company}</span>
                  <Badge 
                    variant="outline" 
                    className={`${threatColors[data.threatLevel]} border-current text-xs uppercase`}
                  >
                    {data.threatLevel}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {data.industry}
                </span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
