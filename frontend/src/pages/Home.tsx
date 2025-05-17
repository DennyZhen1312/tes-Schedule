import { useAuth } from "@clerk/clerk-react";

export default function Home() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut(); // Clears the session and logs out
  };

  return (
    <div className="flex flex-1 items-center justify-center h-screen w-full bg-slate-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg w-80 border-t-4 border-green-500">
        <h2 className="text-2xl font-bold text-blue-500 mb-4">Welcome Home</h2>
        <p className="text-gray-600 mb-4">You are logged in</p>
        <button
          onClick={handleLogout}
          className="w-full py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
