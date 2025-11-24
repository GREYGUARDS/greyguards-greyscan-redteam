import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  alert_type: string;
  narrative_description: string;
  severity: string;
  previous_frequency: number | null;
  current_frequency: number;
  frequency_change_percent: number | null;
  created_at: string;
  is_read: boolean;
}

interface MDMAlertsProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onMarkAllRead: () => void;
}

const MDMAlerts = ({ alerts, onDismiss, onMarkAllRead }: MDMAlertsProps) => {
  const { toast } = useToast();
  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (alerts.length === 0) return null;

  const handleDismiss = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('mdm_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      onDismiss(alertId);
    } catch (error) {
      console.error('Error dismissing alert:', error);
      toast({
        title: "Error",
        description: "Failed to dismiss alert",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getAlertIcon = (type: string) => {
    if (type === 'new_narrative') {
      return <Sparkles className="h-5 w-5" />;
    }
    return <TrendingUp className="h-5 w-5" />;
  };

  const getAlertTitle = (alert: Alert) => {
    if (alert.alert_type === 'new_narrative') {
      return 'New Narrative Detected';
    }
    return `Narrative Surge: +${alert.frequency_change_percent?.toFixed(0)}%`;
  };

  return (
    <Card className="border-4 border-destructive bg-card animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="border-b-4 border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
            MDM Narrative Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} New
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAllRead}
              className="uppercase tracking-wider text-xs"
            >
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-2 rounded-sm relative ${
                alert.is_read ? 'border-border bg-secondary/50' : 'border-destructive bg-destructive/5'
              }`}
            >
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => handleDismiss(alert.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-start gap-3 pr-8">
                <div className={`p-2 rounded-sm ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.alert_type)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold uppercase tracking-wider text-sm">
                      {getAlertTitle(alert)}
                    </p>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>

                  <p className="text-sm text-foreground">
                    {alert.narrative_description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Current Frequency: {alert.current_frequency}</span>
                    {alert.previous_frequency !== null && (
                      <>
                        <span>Previous: {alert.previous_frequency}</span>
                        <span className="text-destructive font-semibold">
                          +{alert.frequency_change_percent?.toFixed(1)}% increase
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Detected: {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-secondary rounded-sm border-2 border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            <strong>Alert Types:</strong> New narratives are marked with ✨ | Surging narratives (50%+ increase) are marked with 📈
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MDMAlerts;
