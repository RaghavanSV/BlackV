import { useState } from "react";

interface C2Profile {
  id: string;
  name: string;
  description: string;
  content: string;
}

export default function ProfileEditorModal({
  profile,
  onSave,
  onClose,
}: {
  profile: C2Profile;
  onSave: (p: C2Profile) => void;
  onClose: () => void;
}) {
  const [editProfile, setEditProfile] = useState<C2Profile>(profile);
  const [format, setFormat] = useState<"json" | "yaml">("json");

  const handleChange = (key: keyof C2Profile, value: string) => {
    setEditProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl w-[90%] max-w-3xl border border-gray-700">
        
        <h2 className="text-2xl font-bold mb-4">Edit C2 Profile</h2>

        {/* Name */}
        <label className="block mb-1 text-gray-300">Profile Name</label>
        <input
          className="bg-gray-800 w-full p-2 rounded border border-gray-700 mb-4"
          value={editProfile.name}
          onChange={(e) => handleChange("name", e.target.value)}
        />

        {/* Description */}
        <label className="block mb-1 text-gray-300">Description</label>
        <input
          className="bg-gray-800 w-full p-2 rounded border border-gray-700 mb-4"
          value={editProfile.description}
          onChange={(e) => handleChange("description", e.target.value)}
        />

        {/* JSON / YAML Toggle */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={() => setFormat("json")}
            className={`px-3 py-1 rounded ${
              format === "json" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setFormat("yaml")}
            className={`px-3 py-1 rounded ${
              format === "yaml" ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            YAML
          </button>
        </div>

        {/* Profile Content */}
        <textarea
          className="bg-gray-800 w-full h-64 p-3 rounded border border-gray-700 text-sm font-mono"
          value={editProfile.content}
          onChange={(e) => handleChange("content", e.target.value)}
        ></textarea>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-4">
          <button
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            onClick={() => onSave(editProfile)}
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
