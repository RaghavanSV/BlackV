import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useWebSocket } from "../ws/useWebSocket";

interface Task {
  ui_id: string;
  task_id: string;
  command: string;
}

interface TaskResult {
  ui_id: string;
  task_id: string;
  agent_id: string;
  result: string;
  time: number;
}

interface Agent {
  id: string;
  hostname: string;
  last_seen: number;
}

export default function AgentDetails() {
  const { id: agentID } = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [results, setResults] = useState<TaskResult[]>([]);

  // Fetch agent metadata
  const fetchAgent = async () => {
    const res = await fetch(`/agents/${agentID}`);
    if (res.ok) {
      const data = await res.json();
      setAgent(data);
    }
  };

  // Fetch previous tasks/results
  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/agent/${agentID}/history`); 
      // You can implement this API later
      if (!res.ok) return;
      const data = await res.json();
      setTasks(data.tasks || []);
      setResults(data.results || []);
    } catch {
      console.log("History API not implemented yet, using WS only.");
    }
  };

  useEffect(() => {
    fetchAgent();
    fetchHistory();
  }, [agentID]);

  // Real-time updates
  useWebSocket((msg) => {
    if (msg.type === "task_created") {
      if (msg.payload.agent_id === agentID) {
        setTasks((prev) => [msg.payload, ...prev]);
      }
    }

    if (msg.type === "task_result") {
      if (msg.payload.agent_id === agentID) {
        setResults((prev) => [
          {
            agent_id: msg.payload.agent_id,
            ui_id: msg.payload.ui_id,
            task_id: msg.payload.task_id,
            result: msg.payload.result,
            time: Date.now() / 1000,
          },
          ...prev,
        ]);
      }
    }
  });

  if (!agent) {
    return <div className="text-gray-400">Loading agent…</div>;
  }

  return (
    <div className="text-white">

      {/* Agent Header */}
      <h1 className="text-2xl font-bold mb-4">
        Agent Details — {agent.hostname}
      </h1>

      <div className="bg-gray-800 p-4 rounded border border-gray-700 mb-6">
        <div className="font-semibold text-green-400 text-lg">
          {agent.hostname}
        </div>
        <div className="text-gray-400 text-sm">Agent ID: {agent.id}</div>
        <div className="text-gray-400 text-sm">
          Last Seen:{" "}
          {new Date(agent.last_seen * 1000).toLocaleString()}
        </div>
      </div>

      {/* Tasks Section */}
      <h2 className="text-xl mb-2 font-semibold">Task History</h2>

      <div className="space-y-3 mb-6">
        {tasks.length === 0 && (
          <div className="text-gray-400">No tasks yet.</div>
        )}

        {tasks.map((t, idx) => (
          <div
            key={idx}
            className="bg-gray-800 p-4 rounded border border-gray-700"
          >
            <div className="flex justify-between">
              <div className="text-green-400 font-bold">
                {t.ui_id}: {t.command}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Results Section */}
      <h2 className="text-xl mb-2 font-semibold">Results</h2>

      <div className="space-y-4">
        {results.length === 0 && (
          <div className="text-gray-400">Waiting for results…</div>
        )}

        {results.map((r, idx) => (
          <div
            key={idx}
            className="bg-gray-800 p-4 rounded border border-gray-700"
          >
            <div className="flex justify-between">
              <div className="text-green-400 font-bold">
                {r.ui_id}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(r.time * 1000).toLocaleString()}
              </div>
            </div>

            <pre className="bg-black/40 mt-3 p-3 rounded text-gray-300 text-sm whitespace-pre-wrap">
              {r.result}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
