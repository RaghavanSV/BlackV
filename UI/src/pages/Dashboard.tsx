import { useEffect, useState } from "react";
import { useWebSocket } from "../ws/useWebSocket";

interface AgentEvent {
  id: string;
  hostname: string;
  time: number;
}

interface TaskEvent {
  agent_id: string;
  ui_id: string;
  command: string;
  time: number;
}

interface ResultEvent {
  agent_id: string;
  ui_id: string;
  result: string;
  time: number;
}

export default function Dashboard() {
  const [onlineAgents, setOnlineAgents] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]); // activity feed

  useEffect(() => {
    // Fetch initial counts from API (if backend supports it)
    const fetchInitial = async () => {
      try {
        const agentRes = await fetch("/agents");
        const agents = await agentRes.json();
        setOnlineAgents(agents.length);
      } catch {}

      try {
        const taskRes = await fetch("/api/task/count"); // optional API
        if (taskRes.ok) {
          const t = await taskRes.json();
          setTotalTasks(t.total);
        }
      } catch {}
    };

    fetchInitial();
  }, []);

  // Real-time updates via WebSocket
  useWebSocket((msg) => {
    if (msg.type === "agent_online") {
      setOnlineAgents((prev) => prev + 1);

      setEvents((prev) => [
        {
          type: "Agent Online",
          icon: "🟢",
          data: msg.payload.hostname,
          time: Date.now(),
        },
        ...prev,
      ]);
    }

    if (msg.type === "task_created") {
      setTotalTasks((prev) => prev + 1);

      setEvents((prev) => [
        {
          type: "Task Created",
          icon: "📌",
          data: `${msg.payload.ui_id} → ${msg.payload.command}`,
          time: Date.now(),
        },
        ...prev,
      ]);
    }

    if (msg.type === "task_result") {
      setEvents((prev) => [
        {
          type: "Task Result",
          icon: "📤",
          data: `Agent ${msg.payload.agent_id}, ${msg.payload.ui_id}`,
          time: Date.now(),
        },
        ...prev,
      ]);
    }
  });

  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Online Agents */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="text-gray-400 text-sm uppercase">Online Agents</div>
          <div className="text-4xl mt-2 text-green-400 font-bold">
            {onlineAgents}
          </div>
        </div>

        {/* Total Tasks */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="text-gray-400 text-sm uppercase">Tasks Created</div>
          <div className="text-4xl mt-2 text-blue-400 font-bold">
            {totalTasks}
          </div>
        </div>

        {/* BlackV Status */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <div className="text-gray-400 text-sm uppercase">System Status</div>
          <div className="text-4xl mt-2 text-yellow-400 font-bold">
            ACTIVE
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-96 overflow-y-auto">
        {events.length === 0 && (
          <div className="text-gray-500">No activity yet…</div>
        )}

        <div className="space-y-3">
          {events.map((e, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded border border-gray-700 flex items-center">
              <span className="mr-3 text-xl">{e.icon}</span>
              <div className="flex-1">
                <div className="text-white font-semibold">{e.type}</div>
                <div className="text-gray-400 text-sm">{e.data}</div>
              </div>
              <div className="text-gray-500 text-xs">
                {new Date(e.time).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
