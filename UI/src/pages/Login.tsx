import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.status !== 200) {
      setError("Invalid credentials");
      return;
    }

    const data = await res.json();
    login(data.token);

    navigate("/dashboard");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-black text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded w-80 space-y-4">
        <h1 className="text-xl font-bold">BlackV Login</h1>

        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 rounded bg-gray-900"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-900"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <button className="w-full bg-blue-600 p-2 rounded hover:bg-blue-500">
          Login
        </button>
      </form>
    </div>
  );
}
