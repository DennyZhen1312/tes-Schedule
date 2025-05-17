import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";

type Availability = {
  id: string;
  effectiveStart: string;
  effectiveEnd: string;
  status: string;
  employee: { name: string };
};

export function Availability() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Helper: convert a date string to a local date string (adjusting for timezone)
  const toLocalDateString = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString();
  };

  // Helper for effectiveEnd: subtract one day (to show 6 days from start) then adjust for timezone
  const toLocalDateStringEffectiveEnd = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1); // subtract one day so UI shows the original "6 days later" date
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString();
  };

  // Fetch availabilities when the component mounts
  useEffect(() => {
    const fetchAvailabilities = async () => {
      const token = await getToken();
      try {
        const response = await fetch("/api/employees/availabilities", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setAvailabilities(data);
      } catch (error) {
        console.error("Error fetching availabilities:", error);
      }
    };

    fetchAvailabilities();
  }, [getToken]);

  const handleEdit = (id: string) => {
    navigate(`/availability/edit/${id}`);
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    try {
      const response = await fetch(`/api/employees/availabilities/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        // Remove the deleted availability from state
        setAvailabilities((prev) => prev.filter((item) => item.id !== id));
      } else {
        console.error("Failed to delete availability");
      }
    } catch (error) {
      console.error("Error deleting availability:", error);
    }
  };

  return (
    <div className="w-full p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">Availability</h2>
        <Link to="/add-availability">
          <button className="bg-black text-white px-4 py-2 rounded">
            + Add Availability
          </button>
        </Link>
      </div>
      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-4 py-2 text-left">Employee</th>
            <th className="px-4 py-2 text-left">Effective Dates</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {availabilities.map((availability) => (
            <tr key={availability.id} className="border-b">
              <td className="px-4 py-2">{availability.employee.name}</td>
              <td className="px-4 py-2">
                {toLocalDateString(availability.effectiveStart)} -{" "}
                {toLocalDateStringEffectiveEnd(availability.effectiveEnd)}
              </td>
              <td className="px-4 py-2">
                <button onClick={() => handleEdit(availability.id)} className="text-blue-500 hover:underline">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(availability.id)}
                  className="text-red-500 hover:underline ml-2"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
