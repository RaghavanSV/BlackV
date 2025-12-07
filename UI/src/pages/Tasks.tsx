import { useEffect, useState } from "react";
import { useWebSocket } from "../ws/useWebSocket";

interface Task {
  ui_id: string;
  task_id: string;
  command: string;
  agent_id: string;
}

export default function Tasks() {
  const [command, setCommand] = useState("");
  const [agentID, setAgentID] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  // WebSocket event listener
  useWebSocket((msg) => {
    if (msg.type === "agent_online") {
      setAgents((prev) => [...prev, msg.payload]);
    }

    if (msg.type === "task_created") {
      setTasks((prev) => [msg.payload, ...prev]);
    }

    if (msg.type === "task_result") {
      console.log("Task result:", msg.payload);
    }
  });

  // Send task to backend
  const sendTask = async () => {
    if (!command || !agentID) {
      alert("Select agent and enter command");
      return;
    }

    const res = await fetch("/api/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_id: agentID,
        command: command,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setCommand("");
    }
  };

  return (
    <div className="text-white">
      <h1 className="text-2xl font-bold mb-4">Send Task</h1>

      {/* Agent Selector */}
      <div className="mb-4">
        <label className="block mb-1">Select Agent</label>
        <select
          className="bg-gray-800 p-2 rounded w-full"
          value={agentID}
          onChange={(e) => setAgentID(e.target.value)}
        >
          <option value="">-- Choose an Agent --</option>
          {agents.map((a, index) => (
            <option key={index} value={a.id}>
              {a.id} ({a.hostname})
            </option>
          ))}
        </select>
      </div>

      {/* Command Input */}
      <div className="mb-4">
        <label className="block mb-1">Command</label>
        <input
          type="text"
          className="bg-gray-800 p-2 rounded w-full"
          placeholder="whoami"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
      </div>

      {/* Send Button */}
      <button
        onClick={sendTask}
        className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Task
      </button>

      {/* Task List */}
      <h2 className="text-xl mt-8 mb-2 font-semibold">Task History</h2>

      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="bg-gray-800 p-3 rounded border border-gray-700"
          >
            <div className="text-green-400 font-bold">
              {task.ui_id} → {task.command}
            </div>
            <div className="text-sm text-gray-400">
              Agent: {task.agent_id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
