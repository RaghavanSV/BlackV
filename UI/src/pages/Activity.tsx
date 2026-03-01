import { Activity as ActivityIcon, Info, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { fetchActivityLogs, ActivityLog } from "@/services/api";
import { toast } from "sonner";

/**
 * Activity Page
 * 
 * This page displays a real-time activity log of all system events.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/activity - Fetches activity logs with optional pagination
 *   Query params: ?limit=50&offset=0
 * - WebSocket events update the log in real-time
 * 
 * Expected JSON Response from GET /api/activity:
 * [
 *   {
 *     "id": "log-uuid",
 *     "timestamp": "2024-01-15T14:42:33Z",
 *     "type": "success",
 *     "agent": "AGENT-001",
 *     "event": "Task completed successfully",
 *     "details": "Screenshot captured and saved"
 *   }
 * ]
 */

const getIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "error":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    default:
      return <Info className="h-5 w-5 text-info" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "success":
      return "border-success/40 text-success bg-success/20";
    case "error":
      return "border-destructive/40 text-destructive bg-destructive/20";
    case "warning":
      return "border-warning/40 text-warning bg-warning/20";
    default:
      return "border-info/40 text-info bg-info/20";
  }
};

export default function Activity() {
  const { allMessages } = useWebSocket();
  const [activityLogState, setActivityLogState] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load activity logs from the backend API
   */
  const loadActivityLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs(50, 0);
      setActivityLogState(data);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivityLogs();
  }, []);

  /**
   * Handle real-time activity updates via WebSocket
   * New activities are added to the top of the list
   */
  useEffect(() => {
    allMessages.forEach((msg) => {
      const newLog: ActivityLog = {
        id: msg.data?.id || `ws-${Date.now()}`,
        timestamp: msg.timestamp
          ? new Date(msg.timestamp).toLocaleString()
          : new Date().toLocaleString(),
        type: (msg.type === "task_result" ? "success" : "info") as ActivityLog['type'],
        agent: msg.data?.agent_id || msg.data?.agent || "SYSTEM",
        event: msg.data?.event || msg.type,
        details: msg.data?.details || JSON.stringify(msg.data),
      };

      setActivityLogState((prev) => {
        const exists = prev.some(
          (log) =>
            log.timestamp === newLog.timestamp && log.event === newLog.event
        );
        if (!exists) {
          return [newLog, ...prev].slice(0, 50);
        }
        return prev;
      });
    });
  }, [allMessages]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Activity</h1>
          <p className="text-muted-foreground">System-wide event log and timeline</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadActivityLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Activity Timeline */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-card-foreground">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLogState.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No activity yet</p>
          ) : (
            <div className="space-y-6">
              {activityLogState.map((log, idx) => (
                <div key={log.id || idx} className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(log.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 pb-6 border-b border-border last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-foreground">{log.event}</span>
                          <Badge 
                            variant="outline" 
                            className={getTypeColor(log.type)}
                          >
                            {log.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-primary">{log.agent}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{log.details}</span>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
