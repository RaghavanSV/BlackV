import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, CheckCircle2, XCircle, RefreshCw, Terminal, Maximize2, Minimize2 } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { fetchAgents, fetchProfiles, createTask, Agent, Profile, Task } from "@/services/api";

interface TerminalBlock {
  id: string;
  command: string;
  output?: string;
  outputType?: "result" | "error" | "info";
  taskId?: string;
  timestamp: string;
}

const TASKS_STORAGE_KEY = "blackv_task_history";

const loadPersistedTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const persistTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error("Failed to persist tasks:", e);
  }
};

const TERMINAL_STORAGE_KEY = "blackv_terminal_history";

const loadTerminalHistory = (): TerminalBlock[] => {
  try {
    const stored = localStorage.getItem(TERMINAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const persistTerminalHistory = (blocks: TerminalBlock[]) => {
  try {
    localStorage.setItem(TERMINAL_STORAGE_KEY, JSON.stringify(blocks.slice(-100)));
  } catch (e) {
    console.error("Failed to persist terminal history:", e);
  }
};

export default function Tasks() {
  const { messages: taskMessages } = useWebSocket("task_created");
  const { messages: resultMessages } = useWebSocket("task_result");
  const processedResultsRef = useRef<Set<string>>(new Set());
  const processedTaskMsgsRef = useRef<Set<string>>(new Set());

  const [selectedAgent, setSelectedAgent] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("default");
  const [command, setCommand] = useState("");
  const [taskHistoryState, setTaskHistoryState] = useState<Task[]>(loadPersistedTasks);
  const [terminalBlocks, setTerminalBlocks] = useState<TerminalBlock[]>(loadTerminalHistory);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist terminal history
  useEffect(() => {
    persistTerminalHistory(terminalBlocks);
  }, [terminalBlocks]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalBlocks]);

  // Add a new command block to terminal
  const addCommandBlock = useCallback((cmd: string): string => {
    const blockId = crypto.randomUUID();
    setTerminalBlocks((prev) => [
      ...prev,
      { id: blockId, command: cmd, timestamp: new Date().toLocaleTimeString() },
    ]);
    return blockId;
  }, []);

  // Attach output to the most recent block matching a taskId, or the last block
  const attachOutput = useCallback((taskId: string | undefined, output: string, outputType: "result" | "error" | "info") => {
    setTerminalBlocks((prev) => {
      const updated = [...prev];
      // Find block by taskId or fallback to last block without output
      let idx = -1;
      if (taskId) {
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].taskId === taskId) { idx = i; break; }
        }
      }
      if (idx === -1) {
        for (let i = updated.length - 1; i >= 0; i--) {
          if (!updated[i].output) { idx = i; break; }
        }
      }
      if (idx !== -1) {
        updated[idx] = { ...updated[idx], output, outputType };
      }
      return updated;
    });
  }, []);

  // Persist task history whenever it changes
  useEffect(() => {
    persistTasks(taskHistoryState);
  }, [taskHistoryState]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [agentsRes, profilesRes] = await Promise.allSettled([
        fetchAgents(),
        fetchProfiles(),
      ]);

      if (agentsRes.status === "fulfilled") {
        setAgents(agentsRes.value || []);
      } else {
        console.error("Failed to load agents:", agentsRes.reason);
        toast.error(`Failed to load agents: ${String(agentsRes.reason?.message || agentsRes.reason)}`);
      }

      if (profilesRes.status === "fulfilled") {
        const data = profilesRes.value || [];
        setProfiles(
          data.length
            ? data
            : [{ id: "default", name: "Default", description: "", config: {} }]
        );
      } else {
        console.error("Failed to load profiles:", profilesRes.reason);
        setProfiles([{ id: "default", name: "Default", description: "", config: {} }]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle real-time WebSocket messages
  useEffect(() => {
    const upsertTask = (id: string, updates: Partial<Task>) => {
      if (!id) return;
      setTaskHistoryState((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...updates };
          return updated;
        }
        return [{ id, agent: "Unknown", command: "N/A", status: "pending", time: new Date().toLocaleString(), ...updates } as Task, ...prev];
      });
    };

    taskMessages.forEach((msg) => {
      const msgKey = msg.timestamp || JSON.stringify(msg.data);
      if (processedTaskMsgsRef.current.has(msgKey)) return;
      processedTaskMsgsRef.current.add(msgKey);
      const id = msg.data?.task_id || msg.data?.id;
      upsertTask(id, {
        agent: msg.data?.agent_id || msg.data?.agent,
        command: msg.data?.command,
        status: msg.data?.status || "pending",
        time: msg.timestamp ? new Date(msg.timestamp).toLocaleString() : new Date().toLocaleString(),
      });
    });

    resultMessages.forEach((msg) => {
      const msgKey = msg.timestamp || JSON.stringify(msg.data);
      if (processedResultsRef.current.has(msgKey)) return;
      processedResultsRef.current.add(msgKey);
      const id = msg.data?.task_id || msg.data?.id;
      const result = msg.data?.result || msg.data?.output || "";
      upsertTask(id, {
        status: msg.data?.status || "completed",
      });
      if (result) {
        attachOutput(id, result, "result");
      }
    });
  }, [taskMessages, resultMessages, attachOutput]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedAgent || !command) {
      toast.error("Please select an agent and enter a command");
      return;
    }

    const blockId = addCommandBlock(command);
    const currentCommand = command;
    setIsSubmitting(true);
    setCommand("");
    try {
      const response = await createTask({
        agentId: selectedAgent,
        command: currentCommand,
        profile: selectedProfile,
      });

      // Link block to task ID for output matching
      const taskId = (response as any)?.id || (response as any)?.task_id;
      if (taskId) {
        setTerminalBlocks((prev) =>
          prev.map((b) => (b.id === blockId ? { ...b, taskId } : b))
        );
      }

      toast.success("Task queued successfully");
    } catch (error) {
      console.error("Failed to create task:", error);
      attachOutput(undefined, `Error: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRefreshAgents = () => {
    loadData();
    toast.success("Refreshing agents & profiles...");
  };

  const handleClearHistory = () => {
    setTaskHistoryState([]);
    toast.success("Task history cleared");
  };

  const handleClearTerminal = () => {
    setTerminalBlocks([]);
    localStorage.removeItem(TERMINAL_STORAGE_KEY);
    toast.success("Terminal cleared");
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Tasks</h1>
          <p className="text-muted-foreground">Create and manage agent tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAgents}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Agent & Profile Selection */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="agent" className="text-foreground">Target Agent</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger id="agent" className="bg-input border-border text-foreground">
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {agents.filter((a) => a.status?.toLowerCase() === "active").map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-popover-foreground">
                  {agent.id} - {agent.hostname}
                </SelectItem>
              ))}
              {agents.filter((a) => a.status?.toLowerCase() === "active").length === 0 && (
                <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No active agents available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile" className="text-foreground">Execution Profile</Label>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger id="profile" className="bg-input border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id} className="text-popover-foreground">
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Terminal */}
      <div className={`rounded-lg border border-[#222] overflow-hidden shadow-lg ${isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""}`}>
        {/* Terminal Header */}
        <div className="flex items-center justify-between bg-[#0a0a0a] px-4 py-2 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            </div>
            <Terminal className="h-4 w-4 text-[#666] ml-2" />
            <span className="text-sm font-mono text-[#666]">root@blackv-c2:~</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-[#666] hover:text-white" onClick={handleClearTerminal}>
              clear
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#666] hover:text-white" onClick={() => setIsFullscreen((f) => !f)}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          className={`bg-[#000000] p-4 font-mono text-sm cursor-text ${isFullscreen ? "h-[calc(100vh-41px)]" : "min-h-[400px]"}`}
          onClick={() => inputRef.current?.focus()}
        >
          <ScrollArea className={isFullscreen ? "h-[calc(100vh-73px)]" : "h-[400px]"}>
            {terminalBlocks.map((block) => (
              <div key={block.id} className="mb-3">
                <div className="flex items-start">
                  <span className="text-[#666] mr-2">&gt;</span>
                  <span className="text-white">{block.command}</span>
                </div>
                {block.output && (
                  <pre className={`mt-0.5 ml-5 whitespace-pre-wrap break-all text-xs leading-relaxed ${
                    block.outputType === "error" ? "text-[#ef5350]" : "text-[#aaa]"
                  }`}>
                    {block.output}
                  </pre>
                )}
              </div>
            ))}

            {/* Active input line */}
            <div className="flex items-center">
              <span className="text-[#666] mr-2">&gt;</span>
              <input
                ref={inputRef}
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                placeholder=""
                disabled={isSubmitting}
                className="flex-1 bg-transparent border-none outline-none text-white caret-white font-mono text-sm"
                autoFocus
              />
              {isSubmitting && <RefreshCw className="h-3 w-3 animate-spin text-[#febc2e]" />}
            </div>
            <div ref={terminalEndRef} />
          </ScrollArea>
        </div>
      </div>

      {/* Task History */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-card-foreground">Task History</CardTitle>
            {taskHistoryState.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-destructive/20 hover:text-destructive"
                onClick={handleClearHistory}
              >
                Clear History
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {taskHistoryState.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No tasks yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Task ID</TableHead>
                  <TableHead className="text-muted-foreground">Agent</TableHead>
                  <TableHead className="text-muted-foreground">Command</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskHistoryState.map((task) => (
                  <TableRow key={task.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono font-medium text-primary">{task.id}</TableCell>
                    <TableCell className="font-mono text-foreground">{task.agent}</TableCell>
                    <TableCell className="font-mono text-foreground">{task.command}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          task.status === "completed"
                            ? "border-success/40 text-success bg-success/20"
                            : task.status === "running"
                            ? "border-primary/40 text-primary bg-primary/20"
                            : task.status === "pending"
                            ? "border-warning/40 text-warning bg-warning/20"
                            : "border-destructive/40 text-destructive bg-destructive/20"
                        }
                      >
                        {task.status === "completed" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {task.status === "running" && <Clock className="h-3 w-3 mr-1" />}
                        {task.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {task.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{task.time}</TableCell>
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
