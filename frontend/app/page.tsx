
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({ username: "", password: "", displayName: "" });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("http://localhost:3001/api/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load users");
        setLoading(false);
      });
  }, [creating]);

  const handleSelectUser = (user) => {
    router.push(`/sales?userId=${user.id}`);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create user");
      } else {
        setNewUser({ username: "", password: "", displayName: "" });
        setCreating(false);
      }
    } catch {
      setError("Failed to create user");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Select User / Cashier</h1>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="w-full max-w-md bg-white rounded shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Existing Users</h2>
          <ul className="mb-4">
            {users.length === 0 && <li className="text-gray-500">No users found.</li>}
            {users.map(user => (
              <li key={user.id} className="flex items-center justify-between mb-2">
                <span className="font-bold uppercase">{user.displayName || user.username} {user.role === 'admin' && <span className="text-xs text-blue-600">(admin)</span>}</span>
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 cursor-pointer"
                  onClick={() => handleSelectUser(user)}
                >Login</button>
              </li>
            ))}
          </ul>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full cursor-pointer"
            onClick={() => setCreating(true)}
          >Create New User</button>
        </div>
      )}
      {(creating || users.length === 0) && (
        <form onSubmit={handleCreateUser} className="w-full max-w-md bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Create New User</h2>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Username</label>
            <input
              className="border px-3 py-2 rounded w-full"
              required
              value={newUser.username}
              onChange={e => setNewUser({ ...newUser, username: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Password</label>
            <input
              className="border px-3 py-2 rounded w-full"
              type="password"
              required
              value={newUser.password}
              onChange={e => setNewUser({ ...newUser, password: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Display Name</label>
            <input
              className="border px-3 py-2 rounded w-full"
              value={newUser.displayName}
              onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full cursor-pointer"
            type="submit"
          >Create User</button>
        </form>
      )}
    </div>
  );
}
