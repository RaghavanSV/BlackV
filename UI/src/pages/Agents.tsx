import { Monitor, Circle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchAgents, Agent } from "@/services/api";
import { toast } from "sonner";

/**
 * Agents Page
 * 
 * This page displays all connected agents/endpoints.
 * 
 * BACKEND INTEGRATION:
 * - GET /api/agents - Fetches all agents from the server
 * - WebSocket "agent_created" events add new agents in real-time
 * 
 * Expected JSON Response from GET /api/agents:
 * [
 *   {
 *     "id": "AGENT-001",
 *     "hostname": "WIN-DESKTOP-01",
 *     "ip": "192.168.1.105",
 *     "os": "Windows 11 Pro",
 *     "user": "admin",
 *     "status": "active",
 *     "lastSeen": "2024-01-15T14:30:00Z"
 *   }
 * ]
 */

export default function Agents() {
  const { messages: agentMessages, allMessages } = useWebSocket("agent_created");
  const [agentsState, setAgentsState] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load agents from the backend API
   * Called on component mount
   */
  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAgents();
      setAgentsState(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  /**
   * Handle real-time agent creation via WebSocket
   * New agents are added to the top of the list
   */
  useEffect(() => {
    agentMessages.forEach((msg) => {
      const newAgent: Agent = {
        id: msg.data?.agent_id || msg.data?.id,
        hostname: msg.data?.hostname,
        ip: msg.data?.ip,
        os: msg.data?.os,
        user: msg.data?.user,
        status: "active",
        lastSeen: new Date().toISOString(),
      };

      setAgentsState((prev) => {
        const exists = prev.some((a) => a.id === newAgent.id);
        if (!exists && newAgent.id) {
          return [newAgent, ...prev];
        }
        return prev;
      });
    });
  }, [agentMessages]);

  /**
   * Update lastSeen for agents when any WebSocket event references them
   */
  useEffect(() => {
    allMessages.forEach((msg) => {
      const agentId = msg.data?.agent_id || msg.data?.agentId;
      if (!agentId) return;
      const timestamp = new Date().toISOString();
      setAgentsState((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, lastSeen: timestamp } : a
        )
      );
    });
  }, [allMessages]);

  /**
   * Format the lastSeen timestamp for display
   * Converts ISO timestamp to relative time
   */
  const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

  const getAgentStatus = (lastSeen: string): "active" | "offline" => {
    try {
      const date = new Date(lastSeen);
      if (isNaN(date.getTime())) return "offline";
      return Date.now() - date.getTime() > OFFLINE_THRESHOLD_MS ? "offline" : "active";
    } catch {
      return "offline";
    }
  };

  const formatLastSeen = (lastSeen: string): string => {
    try {
      const date = new Date(lastSeen);
      if (isNaN(date.getTime())) return lastSeen || "N/A";
      return date.toLocaleString();
    } catch {
      return lastSeen || "N/A";
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Agents</h1>
          <p className="text-muted-foreground">Connected endpoints and beacons</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold text-foreground">{agentsState.length}</span>
            <span className="text-muted-foreground">Total</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadAgents}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Agents Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-card-foreground">Active Endpoints</CardTitle>
        </CardHeader>
        <CardContent>
          {agentsState.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No agents connected</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Agent ID</TableHead>
                  <TableHead className="text-muted-foreground">Hostname</TableHead>
                  <TableHead className="text-muted-foreground">IP Address</TableHead>
                  <TableHead className="text-muted-foreground">Operating System</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentsState.map((agent) => (
                  <TableRow key={agent.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono font-medium text-primary">{agent.id}</TableCell>
                    <TableCell className="text-foreground">{agent.hostname}</TableCell>
                    <TableCell className="font-mono text-foreground">{agent.ip}</TableCell>
                    <TableCell className="text-foreground">{agent.os}</TableCell>
                    <TableCell className="text-foreground">{agent.user}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = getAgentStatus(agent.lastSeen);
                        return (
                          <Badge 
                            variant={status === "active" ? "default" : "secondary"}
                            className={status === "active" 
                              ? "bg-success/20 text-success border-success/40" 
                              : "bg-muted text-muted-foreground"}
                          >
                            <Circle className={`h-2 w-2 mr-1 ${status === "active" ? "fill-success" : ""}`} />
                            {status === "active" ? "online" : "offline"}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastSeen(agent.lastSeen)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
