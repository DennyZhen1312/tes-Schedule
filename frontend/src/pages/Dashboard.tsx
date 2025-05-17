import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useOrganizations } from "../contexts/organization-context";
import { useEmployees } from "../contexts/employee-context";
import { useAuth } from "@clerk/clerk-react";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("Create Organization");
  const { organizations, fetchOrganizations } = useOrganizations();
  const { employees, fetchEmployees } = useEmployees();
  const [userPosition, setUserPosition] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState("");
  const { getToken } = useAuth();

  useEffect(() => {
    fetchEmployees();
    fetchOrganizations();

    // Fetch user role
    const fetchUserDetails = async () => {
      const token = await getToken();
      try {
        const response = await fetch(
          "/api/employees/logged-user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserPosition(data.position);

          // Set default tab based on user role
          setActiveTab(
            data.position === "Admin" ? "Create Organization" : "Requests"
          );
        } else {
          console.error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    // Fetch pending requests count
    const fetchpendingRequests = async () => {
      const token = await getToken();

      const response = await fetch(
        "/api/employees/pending-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingRequest(data);
      } else {
        console.error("Failed to fetch user details");
      }
    };

    fetchUserDetails();
    fetchpendingRequests();
  }, []);

  const handleClick = (tab: string) => {
    setActiveTab(tab);
  };

  if (userPosition === "Admin") {
    return (
      <div className="flex-1 w-full p-6">
        <div className="flex justify-around p-6 space-x-4">
          {/* Only show Total Organizations for Admin */}
          <div className="border shadow-md rounded-lg p-4 text-center w-1/3">
            <p className="text-gray-600">Total Organizations</p>
            <h3 className="text-2xl font-bold">{organizations.length}</h3>
          </div>
          <div className="border shadow-md rounded-lg p-4 text-center w-1/3">
            <p className="text-gray-600">Total Employees</p>
            <h3 className="text-2xl font-bold">
              {employees.filter((emp) => emp.position !== "Admin").length}
            </h3>
          </div>
          <div className="border shadow-md rounded-lg p-4 text-center w-1/3">
            <p className="text-gray-600">Pending Requests</p>
            <h3 className="text-2xl font-bold">{pendingRequest.length}</h3>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex">
          <div className="w-72 mr-5">
            <div className="text-xl font-bold mb-2">Dashboard</div>
            <ul className="pr-5 h-[50vh] border-r border-r-gray-300">
              <li>
                <NavLink
                  to="/dashboard/create-organization"
                  className={
                    activeTab === "Create Organization"
                      ? "text-red-500 font-bold"
                      : "text-gray-600"
                  }
                  onClick={() => handleClick("Create Organization")}
                >
                  Create Organization
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/dashboard/requests"
                  className={`${
                    activeTab === "Requests"
                      ? "text-red-500 font-bold"
                      : "text-gray-600"
                  }`}
                  onClick={() => handleClick("Requests")}
                >
                  Requests
                </NavLink>
              </li>
            </ul>
          </div>

          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="flex justify-around p-6 space-x-4">
        <div className="border shadow-md rounded-lg p-4 text-center w-1/2">
          <p className="text-gray-600">Total Employees</p>
          <h3 className="text-2xl font-bold">
            {employees.filter((emp) => emp.position !== "Admin").length}
          </h3>
        </div>
        <div className="border shadow-md rounded-lg p-4 text-center w-1/2">
          <p className="text-gray-600">Pending Requests</p>
          <h3 className="text-2xl font-bold">{pendingRequest.length}</h3>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex">
        <div className="w-72 mr-5">
          <div className="font-semibold">Dashboard</div>
          <ul className="pr-5 h-[50vh] border-r border-r-gray-300">
            <li>
              <NavLink
                to="/dashboard/requests"
                className={`${
                  activeTab === "Requests"
                    ? "text-red-500 font-bold"
                    : "text-gray-600"
                }`}
                onClick={() => handleClick("Requests")}
              >
                Requests
              </NavLink>
            </li>
          </ul>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
