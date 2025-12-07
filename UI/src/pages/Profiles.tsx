import { useEffect, useState } from "react";

export default function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [editing, setEditing] = useState(null);

  const fetchProfiles = async () => {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    setProfiles(data);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return (
    <div className="space-y-6">

      {/* Page Title */}
      <h1 className="blackv-title">Malleable C2 Profiles</h1>

      {/* Add New Button */}
      <button
        className="btn btn-primary"
        onClick={() => setEditing({ name: "", desc: "", config: "{}" })}
      >
        + New Profile
      </button>

      {/* Profile List Table */}
      <table className="blackv-table">
        <thead>
          <tr>
            <th>Profile</th>
            <th>Description</th>
          </tr>
        </thead>

        <tbody>
          {profiles.map((p, idx) => (
            <tr
              key={idx}
              className="cursor-pointer"
              onClick={() => setEditing(p)}
            >
              <td className="badge-purple">{p.name}</td>
              <td className="text-gray-400">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit/Create Panel */}
      {editing && (
        <div className="blackv-card space-y-4 mt-6 max-w-2xl">
          <h2 className="text-xl font-semibold text-purple-400">
            {editing.id ? "Edit C2 Profile" : "Create C2 Profile"}
          </h2>

          <label className="block">
            <div className="text-sm mb-1">Profile Name</div>
            <input
              className="bg-black border border-gray-700 rounded p-2 w-full"
              value={editing.name}
              onChange={(e) =>
                setEditing({ ...editing, name: e.target.value })
              }
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">Description</div>
            <input
              className="bg-black border border-gray-700 rounded p-2 w-full"
              value={editing.desc}
              onChange={(e) =>
                setEditing({ ...editing, desc: e.target.value })
              }
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1">JSON/YAML Config</div>
            <textarea
              className="bg-black border border-gray-700 rounded p-2 w-full h-40 font-mono text-sm"
              value={editing.config}
              onChange={(e) =>
                setEditing({ ...editing, config: e.target.value })
              }
            />
          </label>

          <div className="flex space-x-4">
            <button
              className="btn btn-danger"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
            <button className="btn btn-primary">Save Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}
