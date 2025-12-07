import { useEffect, useState } from "react";
import { useWebSocket } from "../ws/useWebSocket";

interface TaskResult {
  agent_id: string;
  ui_id: string;
  task_id: string;
  result: string;
  time: number;
}

export default function Results() {
  const [results, setResults] = useState<TaskResult[]>([]);

  // Fetch previous results on page load (optional, backend may implement later)
  const fetchResults = async () => {
    try {
      const res = await fetch("/api/results"); // You will add this later
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      console.log("Results API not implemented yet. Using WS only.");
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Real-time WebSocket listener for task results
  useWebSocket((msg) => {
    if (msg.type === "task_result") {
      const payload = msg.payload;
      setResults((prev) => [
        {
          agent_id: payload.agent_id,
          ui_id: payload.ui_id,
          task_id: payload.task_id,
          result: payload.result,
          time: Date.now() / 1000,
        },
        ...prev,
      ]);
    }
  });

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Task Results</h1>

      {results.length === 0 && (
        <div className="text-gray-400">Waiting for task results…</div>
      )}

      <div className="space-y-4">
        {results.map((r, index) => (
          <div
            key={index}
            className="bg-gray-800 p-4 rounded border border-gray-700"
          >
            {/* Task ID + Agent */}
            <div className="flex justify-between">
              <div className="text-green-400 font-bold">
                {r.ui_id} — Agent {r.agent_id}
              </div>

              <div className="text-sm text-gray-500">
                {new Date(r.time * 1000).toLocaleString()}
              </div>
            </div>

            {/* Result Output */}
            <pre className="bg-black/40 mt-3 p-3 rounded text-gray-300 text-sm whitespace-pre-wrap">
              {r.result}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
