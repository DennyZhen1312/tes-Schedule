import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { FiInbox } from "react-icons/fi";
import { PendingRequest } from "../types/PendingRequest";

export default function PendingRequests() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [userPosition, setUserPosition] = useState<string | null>(null);
  const { getToken } = useAuth();

  // fetch user position
  useEffect(() => {
    (async () => {
      const token = await getToken();
      try {
        const res = await fetch("/api/employees/logged-user", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setUserPosition(data.position);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [getToken]);

  // fetch pending requests
  useEffect(() => {
    (async () => {
      const token = await getToken();
      try {
        const res = await fetch("/api/employees/pending-requests", {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          setPendingRequests(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [getToken]);

  const handleApprove = async (id: string) => {
    const token = await getToken();
    const res = await fetch(
      `/api/employees/pending-requests/${id}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    if (res.ok) setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDeny = async (id: string) => {
    const token = await getToken();
    const res = await fetch(
      `/api/employees/pending-requests/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    if (res.ok) setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="p-6 w-full border rounded-lg shadow-lg">
      <h2 className="flex items-center text-xl font-bold mb-6">
        <FiInbox className="mr-2 text-gray-600" />
        Pending Requests
      </h2>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center text-gray-600">
          <FiInbox className="text-6xl text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-800">No Pending Requests</h3>
          <p>
            There are currently no pending requests from your team members. New
            requests will appear here when they are submitted.
          </p>
        </div>
      ) : (
        <ul>
          {pendingRequests.map((request) => (
            <li
              key={request.id}
              className="flex justify-between items-center border-b pb-4 mb-4"
            >
              <div>
                <p className="font-medium text-gray-800">{request.name}</p>
                <p className="text-sm text-gray-600">{request.position}</p>
              </div>
              {userPosition !== "Manager" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDeny(request.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Deny
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
