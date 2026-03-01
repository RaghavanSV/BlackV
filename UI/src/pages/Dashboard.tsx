import { Bot, Activity, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { fetchDashboardMetrics, fetchRecentActivity, DashboardMetrics, RecentActivity } from "@/services/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast } from "sonner";

const metricIcons = {
  activeAgents: { icon: Bot, color: "text-success" },
  runningTasks: { icon: Activity, color: "text-primary" },
  completedTasks: { icon: CheckCircle, color: "text-info" },
  alerts: { icon: AlertTriangle, color: "text-warning" },
};

export default function Dashboard() {
  const [apiMetrics, setApiMetrics] = useState<DashboardMetrics>({
    activeAgents: 0,
    runningTasks: 0,
    completedTasks: 0,
    alerts: 0,
    agentChange: "—",
    taskQueuedCount: 0,
    completedToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { messages: agentMessages } = useWebSocket("agent_created");
  const { messages: taskCreatedMessages } = useWebSocket("task_created");
  const { messages: taskResultMessages } = useWebSocket("task_result");

  // Derive live metrics by combining API baseline with WS counts
  const metrics: DashboardMetrics = {
    ...apiMetrics,
    activeAgents: apiMetrics.activeAgents + agentMessages.length,
    runningTasks: Math.max(0, apiMetrics.runningTasks + taskCreatedMessages.length - taskResultMessages.length),
    completedTasks: apiMetrics.completedTasks + taskResultMessages.length,
    completedToday: (apiMetrics.completedToday ?? 0) + taskResultMessages.length,
  };

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [metricsData, activityData] = await Promise.allSettled([
        fetchDashboardMetrics(),
        fetchRecentActivity(),
      ]);
      if (metricsData.status === "fulfilled") setApiMetrics(metricsData.value);
      if (activityData.status === "fulfilled") setRecentActivity(activityData.value);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Append new activity from WebSocket events
  useEffect(() => {
    const newActivities: RecentActivity[] = [];

    taskCreatedMessages.forEach((msg) => {
      const id = msg.data?.task_id || msg.data?.id || msg.timestamp;
      if (id && !recentActivity.some((a) => a.id === `ws_task_${id}`)) {
        newActivities.push({
          id: `ws_task_${id}`,
          agent: msg.data?.agent_id || msg.data?.agent || "Unknown",
          action: `Task created: ${msg.data?.command || "N/A"}`,
          time: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : new Date().toLocaleString(),
          status: "info",
        });
      }
    });

    taskResultMessages.forEach((msg) => {
      const id = msg.data?.task_id || msg.data?.id || msg.timestamp;
      if (id && !recentActivity.some((a) => a.id === `ws_result_${id}`)) {
        newActivities.push({
          id: `ws_result_${id}`,
          agent: msg.data?.agent_id || msg.data?.agent || "Unknown",
          action: `Task ${msg.data?.status || "completed"}: ${msg.data?.command || ""}`,
          time: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : new Date().toLocaleString(),
          status: msg.data?.status === "failed" ? "error" : "success",
        });
      }
    });

    agentMessages.forEach((msg) => {
      const id = msg.data?.id || msg.timestamp;
      if (id && !recentActivity.some((a) => a.id === `ws_agent_${id}`)) {
        newActivities.push({
          id: `ws_agent_${id}`,
          agent: msg.data?.hostname || msg.data?.id || "Unknown",
          action: "New agent connected",
          time: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : new Date().toLocaleString(),
          status: "success",
        });
      }
    });

    if (newActivities.length > 0) {
      setRecentActivity((prev) => [...newActivities, ...prev].slice(0, 20));
    }
  }, [agentMessages, taskCreatedMessages, taskResultMessages]);

  const navigate = useNavigate();

  const metricsDisplay = [
    { title: "Agents", value: String(metrics?.activeAgents ?? 0), href: "/agents", ...metricIcons.activeAgents },
    { title: "Running Tasks", value: String(metrics?.runningTasks ?? 0), href: "/tasks", ...metricIcons.runningTasks },
    { title: "Completed", value: String(metrics?.completedTasks ?? 0), href: "/results", ...metricIcons.completedTasks },
    { title: "Alerts", value: String(metrics?.alerts ?? 0), href: "/activity", ...metricIcons.alerts },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Command and control overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metricsDisplay.map((metric) => (
          <Card key={metric.title} className="bg-card border-border cursor-pointer transition-all hover:shadow-lg hover:border-primary/50" onClick={() => navigate(metric.href)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">{metric.title}</CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-card-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={activity.id || idx} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${activity.status === "success" ? "bg-success" : activity.status === "error" ? "bg-destructive" : activity.status === "info" ? "bg-primary" : "bg-warning"}`} />
                    <div>
                      <div className="font-medium text-foreground">{activity.agent}</div>
                      <div className="text-sm text-muted-foreground">{activity.action}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
