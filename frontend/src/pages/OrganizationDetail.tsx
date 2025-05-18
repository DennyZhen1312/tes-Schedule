import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, Link } from "react-router-dom";
import { OrganizationType } from "../types/Organization";
import { AddNewEmployee } from "../components/AddNewEmployee";
import { EditEmployee } from "../components/EditEmployee";
import { FiTrash2, FiRefreshCw, FiUserPlus } from "react-icons/fi";

export default function OrganizationDetails() {
  const { id } = useParams();
  const [organization, setOrganization] = useState<OrganizationType>();
  const { getToken } = useAuth();
  const [showActive, setShowActive] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch organization + employees
  const fetchOrganizationDetails = async () => {
    const token = await getToken();
    const res = await fetch(`/api/organizations/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (res.ok) setOrganization(await res.json());
  };
  useEffect(() => {
    fetchOrganizationDetails();
    const fetchRole = async () => {
      const token = await getToken();
      try {
        const res = await fetch("/api/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const { position } = await res.json();
          setUserRole(position);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchRole();
  }, [id]);

  // Deactivate employee
  const handleDeleteEmployee = async (employeeId: string) => {
    const token = await getToken();
    const res = await fetch(
      `/api/employees/${employeeId}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setOrganization((prev) =>
        prev
          ? {
              ...prev,
              employees: prev.employees.map((e) =>
                e.id === employeeId ? { ...e, isActive: false } : e
              ),
            }
          : prev
      );
    }
  };

  // Reactivate employee
  const handleReactivate = async (email: string) => {
    const token = await getToken();
    const res = await fetch(`/api/employees/reactivate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      const { employee: updatedEmployee } = await res.json();
      setOrganization((prev) =>
        prev
          ? {
              ...prev,
              employees: prev.employees.map((e) =>
                e.email === updatedEmployee.email ? updatedEmployee : e
              ),
            }
          : prev
      );
    }
  };

  if (!organization) return null;

  // Active/inactive lists
  const activeEmps = organization.employees.filter((e) => e.isActive);
  const inactiveEmps = organization.employees.filter((e) => !e.isActive);

  return (
    <div className="w-full p-6 overflow-y-scroll">
      {userRole !== "Manager" && (
        <Link
          to="/organizations"
          className="text-gray-500 hover:text-black hover:underline inline-flex items-center mb-6"
        >
          ← Back to Organizations
        </Link>
      )}
      
      <div className="flex justify-between items-center border p-6 rounded-lg shadow mb-6">
        <div>
          <h2 className="text-2xl font-bold">{organization.name}</h2>
          <p className="text-gray-600">📍 {organization.location}</p>
        </div>
        <AddNewEmployee
          organizationId={id}
          onAdd={(newEmp) =>
            setOrganization((prev) =>
              prev ? { ...prev, employees: [...prev.employees, newEmp] } : prev
            )
          }
        />
      </div>

      <div className="border shadow px-6 pt-6 pb-2 rounded-lg">
        <h3 className="text-2xl font-semibold">Employee List</h3>

        {/* Tabs */}
        <div className="inline-flex rounded-md bg-gray-100 p-1 mb-4">
          <button
            onClick={() => setShowActive(true)}
            className={`px-4 py-2 rounded-l-md ${
              showActive
                ? "bg-white text-indigo-600 font-medium"
                : "text-gray-600"
            }`}
          >
            Active Employees
          </button>
          <button
            onClick={() => setShowActive(false)}
            className={`px-4 py-2 rounded-r-md ${
              !showActive ? "bg-white text-red-500 font-medium" : "text-red-500"
            }`}
          >
            Inactive Employees
          </button>
        </div>

        <div>
          {/* Empty state for Active */}
          {showActive && activeEmps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <FiUserPlus className="text-gray-500 text-6xl" />
              <h3 className="text-xl font-semibold text-gray-800">
                No Active Employees
              </h3>
              <p className="text-gray-600 text-center max-w-sm">
                There are no active employees in this organization. Add a new
                employee or reactivate an inactive one.
              </p>
              <div className="flex space-x-4">
                <AddNewEmployee
                  organizationId={id}
                  onAdd={(newEmp) =>
                    setOrganization((prev) =>
                      prev
                        ? { ...prev, employees: [...prev.employees, newEmp] }
                        : prev
                    )
                  }
                />
                {inactiveEmps.length > 0 && (
                  <button
                    onClick={() => setShowActive(false)}
                    className="flex items-center border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                  >
                    <FiRefreshCw className="mr-2" />
                    Reactivate Employee
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty state for Inactive */}
          {!showActive && inactiveEmps.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <FiUserPlus className="text-gray-500 text-6xl" />
              <h3 className="text-xl font-semibold text-gray-800">
                No Inactive Employees
              </h3>
              <p className="text-gray-600 text-center max-w-sm">
                There are no inactive employees in this organization.
                Deactivated employees will appear here and can be reactivated
                when needed.
              </p>
            </div>
          )}

          {/* List of employees */}
          {(showActive ? activeEmps : inactiveEmps).length > 0 && (
            <div>
              {(showActive ? activeEmps : inactiveEmps).map((emp) => (
                <div
                  key={emp.id}
                  className="flex border border-gray-200 mb-4 justify-between items-center p-4"
                >
                  <div className="">
                    <p className="font-medium text-gray-800">{emp.name}</p>
                    <p className="text-sm text-gray-600">{emp.position}</p>
                  </div>
                  {showActive ? (
                    <div className="flex items-center space-x-4">
                      <EditEmployee
                        employee={emp}
                        organizationName={organization.name}
                        onUpdate={(upd) =>
                          setOrganization((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  employees: prev.employees.map((e) =>
                                    e.id === upd.id ? upd : e
                                  ),
                                }
                              : prev
                          )
                        }
                      />
                      <button
                        onClick={() =>
                          setPendingDelete({ id: emp.id, name: emp.name })
                        }
                        className="text-red-500 hover:text-red-700"
                        aria-label="Delete Employee"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleReactivate(emp.email)}
                      className="bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setPendingDelete(null)}
          />
          <div className="relative bg-white rounded-lg shadow-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">Deactivate Employee</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to deactivate{" "}
              <strong>{pendingDelete.name}</strong>? They will be moved to
              inactive employees and can be reactivated later.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeleteEmployee(pendingDelete.id);
                  setPendingDelete(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
