import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, Target, Shield } from "lucide-react";

const tools = [
  {
    name: "GreyScan",
    description: "Narrative Intelligence Scanner",
    path: "/",
    icon: Search,
  },
  {
    name: "Red Team",
    description: "Crisis Simulation Training",
    path: "/redteam",
    icon: Target,
  },
];

const ToolsNavDropdown = () => {
  const location = useLocation();
  
  const currentTool = tools.find(t => t.path === location.pathname) || tools[0];
  const CurrentIcon = currentTool.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Greyguards</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-card border-2 border-border z-50">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Tools & Services
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = location.pathname === tool.path;
          return (
            <DropdownMenuItem key={tool.path} asChild className="cursor-pointer">
              <Link 
                to={tool.path} 
                className={`flex items-start gap-3 p-2 ${isActive ? 'bg-muted' : ''}`}
              >
                <Icon className={`h-4 w-4 mt-0.5 ${tool.path === '/redteam' ? 'text-destructive' : 'text-primary'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isActive ? 'text-foreground' : ''}`}>
                    {tool.name}
                    {isActive && <span className="ml-2 text-xs text-muted-foreground">(current)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ToolsNavDropdown;
