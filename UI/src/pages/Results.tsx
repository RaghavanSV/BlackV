import { FileText, Download, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useRef, useState, useCallback } from "react";
import { TaskResult } from "@/services/api";
import { toast } from "sonner";

const RESULTS_STORAGE_KEY = "blackv_results";

const loadPersistedResults = (): TaskResult[] => {
  try {
    const stored = localStorage.getItem(RESULTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const persistResults = (results: TaskResult[]) => {
  try {
    localStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(results));
  } catch (e) {
    console.error("Failed to persist results:", e);
  }
};

export default function Results() {
  // Listen to ALL messages, not just "task_result", to handle varied type names
  const { allMessages, isConnected } = useWebSocket();
  const [resultsState, setResultsState] = useState<TaskResult[]>(loadPersistedResults);
  const processedIdsRef = useRef<Set<string>>(new Set());

  // Initialize processed IDs from persisted results
  useEffect(() => {
    resultsState.forEach((r) => processedIdsRef.current.add(r.id));
  }, []);

  // Persist whenever results change
  useEffect(() => {
    persistResults(resultsState);
  }, [resultsState]);

  // Handle real-time result updates via WebSocket
  // Accept messages with type containing "result" or with output/result data
  useEffect(() => {
    allMessages.forEach((msg) => {
      const msgType = (msg.type || "").toLowerCase();
      const hasResultData = msg.data?.output || msg.data?.result || msg.data?.result_id;
      
      // Accept task_result, result, or any message that has result-like data
      if (!msgType.includes("result") && !hasResultData) return;

      const resultId = msg.data?.result_id || msg.data?.id || `RESULT-${msg.timestamp || Date.now()}`;
      
      // Skip already processed
      if (processedIdsRef.current.has(resultId)) return;

      const newResult: TaskResult = {
        id: resultId,
        taskId: msg.data?.task_id || msg.data?.taskId || "N/A",
        agent: msg.data?.agent_id || msg.data?.agent || "Unknown",
        command: msg.data?.command || msg.type || "N/A",
        timestamp: msg.timestamp || new Date().toISOString(),
        output: msg.data?.output || msg.data?.result || JSON.stringify(msg.data, null, 2),
      };

      processedIdsRef.current.add(resultId);
      setResultsState((prev) => [newResult, ...prev]);
    });
  }, [allMessages]);

  const handleDelete = useCallback((resultId: string) => {
    processedIdsRef.current.delete(resultId);
    setResultsState((prev) => prev.filter((r) => r.id !== resultId));
    toast.success("Result removed");
  }, []);

  const handleDownload = useCallback((result: TaskResult) => {
    const blob = new Blob([result.output || ""], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.id}_${result.command}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Download started");
  }, []);

  const handleClearAll = useCallback(() => {
    processedIdsRef.current.clear();
    setResultsState([]);
    toast.success("All results cleared");
  }, []);

  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Results</h1>
          <p className="text-muted-foreground">
            Real-time task execution output via WebSocket
            {!isConnected && (
              <span className="ml-2 text-destructive">(WebSocket disconnected)</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {resultsState.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:bg-destructive/20 hover:text-destructive"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-6">
        {resultsState.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">
                No results yet — waiting for WebSocket events
                {!isConnected && " (currently disconnected)"}
              </p>
            </CardContent>
          </Card>
        ) : (
          resultsState.map((result) => (
            <Card key={result.id} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg text-card-foreground font-mono">
                        {result.id}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-primary bg-primary/20"
                      >
                        {result.taskId}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-mono">{result.agent}</span>
                      <span>•</span>
                      <span className="font-mono">{result.command}</span>
                      <span>•</span>
                      <span>{formatTimestamp(result.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border hover:bg-muted"
                      onClick={() => handleDownload(result)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => handleDelete(result.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/30 border border-border p-4">
                  <pre className="text-sm text-foreground font-mono whitespace-pre-wrap">
                    {result.output}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
