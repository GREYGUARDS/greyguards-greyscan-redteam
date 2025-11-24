import { useState, useEffect } from "react";
import { Bell, X, Filter, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  alert_type: string;
  narrative_description: string;
  severity: string;
  previous_frequency: number | null;
  current_frequency: number | null;
  frequency_change_percent: number | null;
  is_read: boolean;
  created_at: string;
  brand_name: string;
}

interface NotificationCenterProps {
  alerts: Alert[];
  onAlertsUpdate: () => void;
}

export const NotificationCenter = ({ alerts, onAlertsUpdate }: NotificationCenterProps) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const { toast } = useToast();

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const filteredAlerts = filter === "unread" 
    ? alerts.filter(a => !a.is_read)
    : alerts;

  const handleMarkAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from("mdm_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark alert as read",
        variant: "destructive",
      });
    } else {
      onAlertsUpdate();
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("mdm_alerts")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark all alerts as read",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "All alerts marked as read",
      });
      onAlertsUpdate();
    }
  };

  const handleDelete = async (alertId: string) => {
    const { error } = await supabase
      .from("mdm_alerts")
      .delete()
      .eq("id", alertId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    } else {
      onAlertsUpdate();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-danger/10 border-danger text-danger";
      case "high":
        return "bg-warning/10 border-warning text-warning";
      case "medium":
        return "bg-blue-500/10 border-blue-500 text-blue-500";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({alerts.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-6">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    alert.is_read ? "bg-background" : "bg-accent/50"
                  } ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {alert.alert_type === "new_narrative" ? "New Narrative" : "Surge"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(alert.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{alert.brand_name}</p>
                      <p className="text-sm text-foreground/80">{alert.narrative_description}</p>
                      {alert.alert_type === "narrative_surge" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Frequency: {alert.previous_frequency} → {alert.current_frequency} 
                          ({alert.frequency_change_percent?.toFixed(0)}% increase)
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 -mt-1 -mr-1"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {!alert.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 mt-2"
                      onClick={() => handleMarkAsRead(alert.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
