import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWebSocket } from "../ws/useWebSocket";

interface Agent {
  id: string;
  hostname: string;
  last_seen: number;
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  // Fetch initial agents list from backend
  const fetchAgents = async () => {
    const res = await fetch("/agents");
    const data = await res.json();
    setAgents(data);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  // WebSocket listener for real-time agent updates
  useWebSocket((msg) => {
    if (msg.type === "agent_online") {
      const { id, hostname } = msg.payload;

      setAgents((prev) => {
        const exists = prev.some((a) => a.id === id);
        if (exists) return prev;

        return [
          {
            id,
            hostname,
            last_seen: Date.now() / 1000,
          },
          ...prev,
        ];
      });
    }
  });

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Agents</h1>

      {agents.length === 0 && (
        <div className="text-gray-400">No agents online.</div>
      )}

      <div className="space-y-3">
        {agents.map((agent, idx) => (
          <Link key={idx} to={`/agents/${agent.id}`}>
            <div className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center hover:bg-gray-700 cursor-pointer transition">
              <div>
                <div className="text-lg font-semibold text-green-400">
                  {agent.hostname}
                </div>
                <div className="text-gray-400 text-sm">
                  ID: {agent.id}
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm text-gray-400">
                  Last seen:{" "}
                  {new Date(agent.last_seen * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
