import { useState } from "react";
import { useWebSocket } from "../ws/useWebSocket";

interface LogEntry {
  type: string;
  message: string;
  icon: string;
  time: number;
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // WebSocket: react to events
  useWebSocket((msg) => {
    if (msg.type === "agent_online") {
      const { id, hostname } = msg.payload;
      addLog("Agent Online", `Agent ${hostname} (${id}) connected.`, "🟢");
    }

    if (msg.type === "task_created") {
      const { ui_id, command, agent_id } = msg.payload;
      addLog("Task Created", `Task ${ui_id} → ${command} for agent ${agent_id}.`, "📌");
    }

    if (msg.type === "task_result") {
      const { ui_id, agent_id } = msg.payload;
      addLog("Task Result", `Agent ${agent_id} returned result for ${ui_id}.`, "📤");
    }
  });

  function addLog(type: string, message: string, icon: string) {
    setLogs((prev) => [
      {
        type,
        message,
        icon,
        time: Date.now(),
      },
      ...prev,
    ]);
  }

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Activity Log</h1>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-[80vh] overflow-y-auto">
        {logs.length === 0 && (
          <div className="text-gray-500">No activity recorded yet…</div>
        )}

        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="bg-gray-800 p-3 rounded border border-gray-700 flex items-center hover:bg-gray-700 transition"
            >
              {/* Icon */}
              <div className="mr-3 text-2xl">{log.icon}</div>

              {/* Log Content */}
              <div className="flex-1">
                <div className="font-semibold text-white">{log.type}</div>
                <div className="text-gray-400">{log.message}</div>
              </div>

              {/* Timestamp */}
              <div className="text-gray-500 text-sm ml-4 whitespace-nowrap">
                {new Date(log.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
