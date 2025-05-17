import { useEffect } from "react";
import { LuBuilding } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useOrganizations } from "../contexts/organization-context";
import { useEmployees } from "../contexts/employee-context";
import { EditOrganization } from "../components/EditOrganization";

export default function Organizations() {
  const { organizations, remove, fetchOrganizations } = useOrganizations();
  const { employees, fetchEmployees } = useEmployees();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();

    const checkUserRole = async () => {
      const token = await getToken();
      try {
        const resp = await fetch("/api/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.position === "Manager") {
            navigate(`/organizations/${data.organizationId}`);
          }
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    checkUserRole();
  }, []);

  if (organizations.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen bg-gray-100">
        <LuBuilding className="text-gray-500 text-6xl mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          No Organizations Yet
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Get started by adding your first organization to manage employees and
          schedules.
        </p>
        <Link to="/dashboard/create-organization">
          <button className="bg-black text-white py-2 px-4 rounded hover:bg-gray-700 transition">
            + Add Your First Organization
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full p-6">
      <h2 className="text-2xl font-bold mb-4">Organizations Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="relative bg-white p-6 border rounded-lg shadow-md hover:shadow-lg transition"
          >
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {org.name}
              </h3>
              <div className="flex space-x-2">
                <EditOrganization
                  organization={org}
                  onClose={fetchOrganizations}
                />
                <button
                  onClick={() => remove(org.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              📍 {org.location || "Location not specified"}
            </p>
            <p className="text-gray-600 mb-4">
              {employees.filter((e) => e.organizationId === org.id).length}{" "}
              employees
            </p>
            <Link
              to={`/organizations/${org.id}`}
              className="bg-black text-white py-1 px-3 rounded hover:bg-gray-700 transition"
              >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
