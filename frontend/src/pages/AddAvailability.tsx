import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useParams, useNavigate } from "react-router-dom";
import { EmployeeType } from "../types/Employee";
import { OrganizationType } from "../types/Organization";
import { addDays } from "date-fns";
import { Availability, DailyAvailabilitySlot } from "./Schedules";

type AvailabilityDay = {
  day: string;
  allDay: boolean;
  available: boolean;
  startTime: string;
  endTime: string;
};

export default function AddAvailability() {
  const { id } = useParams(); // ID for editing; if present, we're editing an existing record
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // Helper: determine if editing based on id presence
  const isEditing = Boolean(id);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [, setUserOrganizationId] = useState<string | null>(null);
  const [, setUserId] = useState<string | null>(null);

  // State for organization selection (for Admin users)
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");

  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Date helpers

  // Format a Date object as "yyyy-mm-dd" in UTC
  const formatDateUTC = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get the Monday for the given date using UTC values
  const getMondayOfDate = (date: Date): Date => {
    const day = date.getUTCDay(); // Using UTC day
    const offset = (day + 6) % 7;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() - offset);
    return monday;
  };

  // Get the current Monday (formatted in UTC)
  const getCurrentMonday = (): string => {
    const now = new Date();
    const monday = getMondayOfDate(now);
    return formatDateUTC(monday);
  };

  // Initial effective dates default values (using UTC)
  const [effectiveStartDate, setEffectiveStartDate] = useState<string>(
    formatDateUTC(getMondayOfDate(new Date()))
  );
  const [effectiveEndDate, setEffectiveEndDate] = useState<string>(
    formatDateUTC(addDays(getMondayOfDate(new Date()), 6))
  );

  // Default availability (for new entries)
  const defaultAvailability: AvailabilityDay[] = [
    {
      day: "Monday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "23:00",
    },
    {
      day: "Tuesday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "23:00",
    },
    {
      day: "Wednesday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "23:00",
    },
    {
      day: "Thursday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "23:00",
    },
    {
      day: "Friday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "24:00",
    },
    {
      day: "Saturday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "24:00",
    },
    {
      day: "Sunday",
      allDay: true,
      available: false,
      startTime: "09:00",
      endTime: "23:00",
    },
  ];

  const [availability, setAvailability] =
    useState<AvailabilityDay[]>(defaultAvailability);

  // Fetch user details and set up data based on role
  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = await getToken();
      try {
        const response = await fetch("/api/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.position);
          setUserOrganizationId(data.organizationId);
          setUserId(data.id);

          if (data.position === "Admin") {
            fetchOrganizations();
          } else if (data.position === "Manager") {
            await fetchEmployeesByOrganization(data.organizationId);
            // For Manager, set the selected organization to the manager's own organization
            setSelectedOrganization(data.organizationId);
          } else {
            setSelectedEmployee(data.id);
          }
        } else {
          console.error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [getToken]);

  // Fetch organizations for Admin
  const fetchOrganizations = async () => {
    const token = await getToken();
    try {
      const response = await fetch("/api/organizations", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      } else {
        console.error("Failed to fetch organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  // Fetch employees filtered by organization ID
  const fetchEmployeesByOrganization = async (orgId: string) => {
    const token = await getToken();
    try {
      const response = await fetch(
        `/api/employees?organizationId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error("Failed to fetch employees");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Handle start date change using UTC parsing and formatting
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.value;
    // Append "T00:00:00Z" to ensure UTC parsing
    const selectedDate = new Date(selected + "T00:00:00Z");
    const monday = getMondayOfDate(selectedDate);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    setEffectiveStartDate(formatDateUTC(monday));
    setEffectiveEndDate(formatDateUTC(sunday));
  };

  // Handle organization selection (for Admin)
  const handleOrganizationChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const orgId = e.target.value;
    setSelectedOrganization(orgId);
    await fetchEmployeesByOrganization(orgId);
  };

  // If editing, fetch the existing availability record and populate state
  useEffect(() => {
    if (id) {
      const fetchAvailability = async () => {
        const token = await getToken();
        try {
          const response = await fetch(
            `/api/employees/availabilities/${id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (response.ok) {
            const data = await response.json();

            // Set the effective dates (subtract one day from effectiveEnd for display)
            setEffectiveStartDate(formatDateUTC(new Date(data.effectiveStart)));
            setEffectiveEndDate(
              formatDateUTC(addDays(new Date(data.effectiveEnd), -1))
            );

            // Pre-select organization and employee using data from the backend
            fetchEmployeesByOrganization(data.employee.organizationId);
            setSelectedOrganization(data.employee.organizationId);
            setSelectedEmployee(data.employee.id);

            // Map the fetched DailyAvailabilitySlot array to update availability state
            const updatedAvailability = defaultAvailability.map((dayItem) => {
              const slots: DailyAvailabilitySlot[] =
                data.DailyAvailabilitySlot || [];
              const fetchedSlot = slots.find(
                (slot) => slot.day === dayItem.day
              );
              if (fetchedSlot) {
                return {
                  day: dayItem.day,
                  allDay: fetchedSlot.allDay,
                  available: fetchedSlot.available,
                  startTime: fetchedSlot.startTime ?? dayItem.startTime,
                  endTime: fetchedSlot.endTime ?? dayItem.endTime,
                };
              }
              return dayItem;
            });

            setAvailability(updatedAvailability);
          } else {
            console.error("Failed to fetch availability details");
          }
        } catch (error) {
          console.error("Error fetching availability details:", error);
        }
      };
      fetchAvailability();
    }
  }, [id, getToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();

    // --- Check for duplicate week availability ---
    try {
      const res = await fetch(
        "/api/employees/availabilities",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const existingAvailabilities = await res.json();
        // Filter availabilities for the selected employee
        const employeeAvailabilities = existingAvailabilities.filter(
          (a: Availability) =>
            a.employeeId === selectedEmployee && (!isEditing || a.id !== id)
        );
        // Convert the effectiveStart dates to a simple YYYY-MM-DD string
        const newWeekStart = new Date(effectiveStartDate)
          .toISOString()
          .split("T")[0];
        const duplicate = employeeAvailabilities.find((a: Availability) => {
          const existingWeekStart = new Date(a.effectiveStart)
            .toISOString()
            .split("T")[0];
          return existingWeekStart === newWeekStart;
        });
        if (duplicate) {
          alert(
            "This employee already has availability set for the selected week."
          );
          return; // Stop submission if a duplicate is found
        }
      } else {
        console.error("Failed to fetch existing availabilities.");
      }
    } catch (error) {
      console.error("Error checking existing availabilities:", error);
    }
    // ---------------------------------------------

    // Adjust the effective end date and convert to ISO string
    const adjustedEffectiveEnd = addDays(new Date(effectiveEndDate), 1);
    const payload = {
      employeeId: selectedEmployee,
      effectiveStart: new Date(effectiveStartDate).toISOString(),
      effectiveEnd: adjustedEffectiveEnd.toISOString(),
      availability,
    };

    const url = id
      ? `/api/employees/availabilities/${id}`
      : `/api/employees/availabilities`;
    const method = id ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(
          id
            ? "Availability updated successfully!"
            : "Availability added successfully!"
        );
        navigate("/availability");
      } else {
        alert("Failed to save availability.");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
    }
  };

  return (
    <div className="flex-1 w-full p-6">
      <h2 className="text-xl font-bold mb-4">
        {id ? "Edit Availability" : "Add Availability"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {userRole === "Admin" && (
          <label className="block">
            <span className="font-semibold">Select Organization</span>
            <select
              value={selectedOrganization}
              onChange={handleOrganizationChange}
              className="w-full p-2 border rounded"
              required
              disabled={isEditing} // Disabled when editing
            >
              <option value="" disabled>
                Choose an organization
              </option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {((userRole === "Admin" && selectedOrganization) ||
          userRole === "Manager") && (
          <label className="block">
            <span className="font-semibold">Select Employee</span>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full p-2 border rounded"
              required
              disabled={isEditing} // Disabled when editing
            >
              <option value="" disabled>
                Choose an employee
              </option>
              {employees
                .filter(
                  (employee) =>
                    employee.organizationId === selectedOrganization &&
                    employee.position !== "Admin"
                )
                .map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
            </select>
          </label>
        )}
        {userRole && userRole !== "Admin" && userRole !== "Manager"}
        <label className="block">
          <span className="font-semibold">Effective Dates</span>
          <div className="flex space-x-2">
            <input
              type="date"
              value={effectiveStartDate}
              onChange={handleStartDateChange}
              className="p-2 border rounded w-1/2"
              required
              min={getCurrentMonday()}
            />
            <input
              type="date"
              value={effectiveEndDate}
              readOnly
              className="p-2 border rounded w-1/2"
            />
          </div>
        </label>
        <div className="p-4 border rounded-lg shadow space-y-4">
          {availability.map((day, dayIndex) => (
            <div key={day.day}>
              <span className="font-bold">{day.day}</span>
              <div className="mt-2 flex flex-col space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={day.allDay ? true : day.available}
                    disabled={day.allDay}
                    onChange={(e) => {
                      setAvailability((prev) =>
                        prev.map((d, i) =>
                          i === dayIndex
                            ? { ...d, available: e.target.checked }
                            : d
                        )
                      );
                    }}
                  />
                  <span>Available</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={day.allDay}
                    onChange={(e) => {
                      const isAllDay = e.target.checked;
                      setAvailability((prev) =>
                        prev.map((d, i) =>
                          i === dayIndex
                            ? {
                                ...d,
                                allDay: isAllDay,
                                available: isAllDay ? true : d.available,
                              }
                            : d
                        )
                      );
                    }}
                  />
                  <span>All Day</span>
                </label>
                {!day.allDay && day.available && (
                  <div className="flex space-x-4 items-center">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) =>
                        setAvailability((prev) =>
                          prev.map((d, i) =>
                            i === dayIndex
                              ? { ...d, startTime: e.target.value }
                              : d
                          )
                        )
                      }
                      className="border rounded p-2"
                    />
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) =>
                        setAvailability((prev) =>
                          prev.map((d, i) =>
                            i === dayIndex
                              ? { ...d, endTime: e.target.value }
                              : d
                          )
                        )
                      }
                      className="border rounded p-2"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-4 justify-end">
          <button
            type="button"
            onClick={() => navigate("/availability")}
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
