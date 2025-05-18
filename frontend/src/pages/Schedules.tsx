import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { useOrganizations } from "../contexts/organization-context";
import { useAuth } from "@clerk/clerk-react";

type EmployeeType = {
  id: string;
  name: string;
  organizationId: string | null; // can be null (for admin, etc.)
  position?: string;
  isActive: boolean;
};

export type DailyAvailabilitySlot = {
  day: string;
  allDay: boolean;
  available: boolean;
  startTime?: string | null;
  endTime?: string | null;
};

export type Availability = {
  id: string;
  employeeId: string;
  effectiveStart: string;
  effectiveEnd: string;
  DailyAvailabilitySlot: DailyAvailabilitySlot[];
  employee: {
    id: string;
    name: string;
    organizationId: string | null;
  };
};

export type ScheduledShift = {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  employee: {
    id: string;
    name: string;
    organizationId: string | null;
  };
};

type ScheduleDay = {
  date: Date;
  employees: number;
};

type AvailabilitySlot = {
  startTime: string;
  endTime: string;
};

type AvailabilityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  employee: { id: string; name: string } | null;
  // The full availability for that day (could be merged from multiple slots)
  availabilityData: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[];
  onAssign: (slot: AvailabilitySlot) => void;
};

// Convert to 12-hour format (handle "24:00" specially)
function convertTo12Hour(timeStr: string): string {
  if (timeStr === "24:00") return "24:00";
  const [hoursStr, minutes] = timeStr.split(":");
  let hours = parseInt(hoursStr, 10);
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${hours}:${minutes} ${period}`;
}

export function AvailabilityModal({
  isOpen,
  onClose,
  date,
  employee,
  availabilityData,
  onAssign,
}: AvailabilityModalProps) {
  const availableSlots = availabilityData.filter((slot) => slot.available);
  const defaultStart =
    availableSlots.length > 0
      ? availableSlots.reduce((prev, curr) =>
          curr.startTime! < prev.startTime! ? curr : prev
        ).startTime!
      : "00:00";
  const defaultEndOriginal =
    availableSlots.length > 0
      ? availableSlots.reduce((prev, curr) =>
          curr.endTime! > prev.endTime! ? curr : prev
        ).endTime!
      : "23:59";
  const defaultEndForInput =
    defaultEndOriginal === "24:00" ? "00:00" : defaultEndOriginal;

  const [customStart, setCustomStart] = useState(defaultStart);
  const [customEnd, setCustomEnd] = useState(defaultEndOriginal);

  useEffect(() => {
    if (isOpen) {
      setCustomStart(defaultStart);
      setCustomEnd(defaultEndOriginal);
    }
  }, [isOpen, defaultStart, defaultEndOriginal]);

  function timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }
  const convertInputTimeToMinutes = (
    time: string,
    defaultIs24: boolean
  ): number => {
    if (defaultIs24 && time === "00:00") return 1440;
    return timeStringToMinutes(time);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const defaultIs24 = defaultEndOriginal === "24:00";
    const customStartMins = timeStringToMinutes(customStart);
    const customEndForCalc = customEnd === "24:00" ? "00:00" : customEnd;
    const customEndMins = convertInputTimeToMinutes(
      customEndForCalc,
      defaultIs24
    );
    const defaultStartMins = timeStringToMinutes(defaultStart);
    const defaultEndMins = defaultIs24
      ? 1440
      : timeStringToMinutes(defaultEndOriginal);

    if (
      customStartMins < defaultStartMins ||
      customEndMins > defaultEndMins ||
      customStartMins >= customEndMins
    ) {
      alert("Please select times within the available range.");
      return;
    }
    onAssign({ startTime: customStart, endTime: customEnd });
    onClose();
  };

  if (!isOpen || !employee || !date) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Assign Hours for {employee.name} on {format(date, "MMM dd, yyyy")}
        </h2>
        <p className="mb-4">
          Available from <strong>{convertTo12Hour(defaultStart)}</strong> to{" "}
          <strong>
            {defaultEndOriginal === "24:00"
              ? "12:00 AM"
              : convertTo12Hour(defaultEndOriginal)}
          </strong>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {/* form inputs */}
          <div>
            <label className="block font-medium">Start Time</label>
            <input
              type="time"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              min={defaultStart}
              max={
                defaultEndOriginal === "24:00" ? undefined : defaultEndOriginal
              }
              required
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">End Time</label>
            <input
              type="time"
              value={customEnd === "24:00" ? defaultEndForInput : customEnd}
              onChange={(e) => {
                const val = e.target.value;
                if (defaultEndOriginal === "24:00" && val === "00:00") {
                  setCustomEnd("24:00");
                } else {
                  setCustomEnd(val);
                }
              }}
              min={customStart}
              max={
                defaultEndOriginal === "24:00"
                  ? defaultEndForInput
                  : defaultEndOriginal
              }
              required
              className="border p-2 rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Assign Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// New modal component for editing an already assigned shift.
type EditShiftModalProps = {
  isOpen: boolean;
  shift: ScheduledShift | null;
  onClose: () => void;
  onUpdate: (updatedShift: {
    id: string;
    startTime: string;
    endTime: string;
  }) => void;
};

function EditShiftModal({
  isOpen,
  shift,
  onClose,
  onUpdate,
}: EditShiftModalProps) {
  const [startTime, setStartTime] = useState(shift ? shift.startTime : "");
  const [endTime, setEndTime] = useState(shift ? shift.endTime : "");

  useEffect(() => {
    if (shift) {
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
    }
  }, [shift]);

  if (!isOpen || !shift) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ id: shift.id, startTime, endTime });
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={onClose} />
      {/* Modal Container */}
      <div className="relative bg-white rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">
          Edit Shift for {shift.employee.name} on{" "}
          {format(new Date(shift.date), "MMM dd, yyyy")}
        </h2>
        <p className="mb-4">
          Available from <strong>{shift.startTime}</strong> to{" "}
          <strong>
            {shift.endTime === "24:00" ? "12:00 AM" : shift.endTime}
          </strong>
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div>
            <label className="block font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block font-medium">End Time</label>
            <input
              type="time"
              value={endTime === "24:00" ? "00:00" : endTime}
              onChange={(e) => {
                const val = e.target.value;
                if (shift.endTime === "24:00" && val === "00:00") {
                  setEndTime("24:00");
                } else {
                  setEndTime(val);
                }
              }}
              min={startTime}
              required
              className="border p-2 rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Save Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const Schedules = () => {
  const [currentWeek, setCurrentWeek] = useState<ScheduleDay[] | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  // Holds all employees for the selected organization (from API)
  const [employeesForOrg, setEmployeesForOrg] = useState<EmployeeType[]>([]);
  // Holds employees manually added to the schedule (even if no shift yet)
  const [activeEmployees, setActiveEmployees] = useState<EmployeeType[]>([]);
  const { organizations } = useOrganizations();
  const { getToken } = useAuth();

  const [availabilitiesByEmployee, setAvailabilitiesByEmployee] = useState<{
    [employeeId: string]: Availability[];
  }>({});
  const [scheduledShifts, setScheduledShifts] = useState<ScheduledShift[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [modalEmployee, setModalEmployee] = useState<EmployeeType | null>(null);
  const [modalSlots, setModalSlots] = useState<DailyAvailabilitySlot[]>([]);

  // New state for editing shifts
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState<ScheduledShift | null>(null);

  // New state to hold user role and organization for access control
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(
    null
  );
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Split "YYYY-MM-DD" into numbers
    const [year, month, day] = e.target.value.split("-").map(Number);

    // monthIndex is zero-based, so subtract 1:
    const picked = new Date(year, month - 1, day);

    // Now startOfWeek will correctly give the Monday of that week
    const weekStart = startOfWeek(picked, { weekStartsOn: 1 });
    const newWeek: ScheduleDay[] = Array.from({ length: 7 }, (_, i) => ({
      date: addDays(weekStart, i),
      employees: 0,
    }));

    setCurrentWeek(newWeek);
  };

  // Initialize current week.
  useEffect(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const days: ScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      days.push({ date: day, employees: 0 });
    }
    setCurrentWeek(days);
  }, []);

  // Fetch user details to restrict access for Manager
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
          if (data.position === "Manager") {
            // For Manager, force selected organization to be manager's own organization
            setSelectedOrganization(data.organizationId);
            await fetchEmployeesByOrganization(data.organizationId);
            await fetchAvailabilities(data.organizationId);
            await fetchScheduledShifts(data.organizationId);
          } else {
            // Employees: lock them into their own org
            setSelectedOrganization(data.organizationId);
            // fetch only that org
            await fetchEmployeesByOrganization(data.organizationId);
            await fetchAvailabilities(data.organizationId);
            await fetchScheduledShifts(data.organizationId);
          }
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };
    fetchUserDetails();
  }, [getToken]);

  // Fetch employees for a given organization.
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
        const data: EmployeeType[] = await response.json();
        // Only include employees whose organizationId exactly matches the selected orgId.
        setEmployeesForOrg(data.filter((emp) => emp.organizationId === orgId));
      } else {
        console.error("Failed to fetch employees for organization");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAvailabilities = async (orgId: string) => {
    const token = await getToken();
    const response = await fetch(
      "/api/employees/availabilities",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      console.error("Failed to fetch availabilities");
      return;
    }
    const data: Availability[] = await response.json();
    const filteredData = data.filter(
      (av) => av.employee.organizationId === orgId
    );
    const grouped: { [employeeId: string]: Availability[] } = {};
    for (const avail of filteredData) {
      if (!grouped[avail.employeeId]) {
        grouped[avail.employeeId] = [];
      }
      grouped[avail.employeeId].push(avail);
    }
    setAvailabilitiesByEmployee(grouped);
  };

  const fetchScheduledShifts = async (orgId: string) => {
    const token = await getToken();
    const response = await fetch(
      `/api/employees/scheduled-shifts?organizationId=${orgId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.ok) {
      const data: ScheduledShift[] = await response.json();
      setScheduledShifts(data);
    } else {
      console.error("Failed to fetch scheduled shifts");
    }
  };

  const handleOrganizationChange = async (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const orgId = event.target.value;
    setSelectedOrganization(orgId);
    if (orgId) {
      await fetchEmployeesByOrganization(orgId);
      await fetchAvailabilities(orgId);
      await fetchScheduledShifts(orgId);
    }
  };

  // When adding a new employee manually, add to the activeEmployees list.
  const handleAddEmployee = (employee: EmployeeType) => {
    setActiveEmployees((prev) => {
      if (prev.some((e) => e.id === employee.id)) return prev;
      return [...prev, employee];
    });
  };

  const handleCellClick = (day: ScheduleDay, employee: EmployeeType) => {
    const employeeAvailabilities = availabilitiesByEmployee[employee.id] || [];
    const targetDayName = format(day.date, "EEEE");

    const dateAvailabilities = employeeAvailabilities.filter((av) => {
      const start = new Date(av.effectiveStart);
      const end = new Date(av.effectiveEnd);
      return day.date >= start && day.date <= end;
    });

    let daySlots: DailyAvailabilitySlot[] = [];
    for (const av of dateAvailabilities) {
      const slotsForDay = av.DailyAvailabilitySlot.filter(
        (slot) => slot.day === targetDayName
      );
      daySlots = daySlots.concat(slotsForDay);
    }

    const hasAvailableSlot = daySlots.some((s) => s.available);
    if (!hasAvailableSlot) return;

    setModalDate(day.date);
    setModalEmployee(employee);
    setModalSlots(daySlots);
    setIsModalOpen(true);
  };

  const handleAssign = async (slot: AvailabilitySlot) => {
    if (!modalEmployee || !modalDate) return;
    const token = await getToken();
    const dateString = modalDate.toISOString();
    try {
      const response = await fetch(
        "/api/employees/scheduled-shifts",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: modalEmployee.id,
            date: dateString,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }),
        }
      );
      if (response.ok) {
        console.log("Shift assigned successfully with custom times!");
        // Refresh scheduled shifts after assignment
        await fetchScheduledShifts(selectedOrganization);
      } else {
        console.error("Failed to assign shift:", await response.text());
      }
    } catch (error) {
      console.error("Error assigning shift:", error);
    }
  };

  // Handler to open the edit modal for an assigned shift.
  const handleOpenEditModal = (shift: ScheduledShift) => {
    setShiftToEdit(shift);
    setIsEditModalOpen(true);
  };

  // Handler to update an existing shift.
  const handleUpdateShift = async (updatedShift: {
    id: string;
    startTime: string;
    endTime: string;
  }) => {
    const token = await getToken();
    // Adjust the endTime: if it's "00:00", change it to "24:00"
    const adjustedEndTime =
      updatedShift.endTime === "00:00" ? "24:00" : updatedShift.endTime;

    try {
      const response = await fetch(
        `/api/employees/scheduled-shifts/${updatedShift.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startTime: updatedShift.startTime,
            endTime: adjustedEndTime,
          }),
        }
      );
      if (response.ok) {
        setScheduledShifts((prev) =>
          prev.map((shift) =>
            shift.id === updatedShift.id
              ? {
                  ...shift,
                  startTime: updatedShift.startTime,
                  endTime: adjustedEndTime,
                }
              : shift
          )
        );
      } else {
        console.error("Failed to update shift:", await response.text());
      }
    } catch (error) {
      console.error("Error updating shift:", error);
    }
  };

  if (!currentWeek) {
    return <div>Loading...</div>;
  }

  // Filter employees to include only active ones.
  const activeEmployeesForOrg = employeesForOrg.filter((emp) => emp.isActive);

  // Use active employees to filter scheduled shifts.
  const validScheduledShifts = scheduledShifts.filter((shift) =>
    activeEmployeesForOrg.some((emp) => emp.id === shift.employeeId)
  );

  // Compute the list of employees with at least one valid scheduled shift.
  const employeesWithShift = activeEmployeesForOrg.filter((employee) =>
    validScheduledShifts.some((shift) => shift.employeeId === employee.id)
  );
  const displayEmployees = Array.from(
    new Map(
      [...employeesWithShift, ...activeEmployees].map((emp) => [emp.id, emp])
    ).values()
  );

  // Use validScheduledShifts in place of scheduledShifts when finding assigned shifts.
  const findAssignedShift = (
    employeeId: string,
    date: Date
  ): ScheduledShift | undefined => {
    return validScheduledShifts.find((shift) => {
      const shiftDate = new Date(shift.date);
      return (
        shift.employeeId === employeeId &&
        shiftDate.toDateString() === date.toDateString()
      );
    });
  };
  // --- End New Code ---

  // For the dropdown, list available employees that are not already displayed.
  const uniqueAvailableEmployees = employeesForOrg.filter(
    (emp) => !displayEmployees.some((de) => de.id === emp.id)
  );

  return (
    <div className="flex-1 w-full p-4">
      <div className="flex mb-6">
        <button
          className="border border-gray-200 bg-white px-2 py-1 hover:bg-gray-300"
          onClick={() => {
            if (!currentWeek) return;
            const newWeek = currentWeek.map((day) => ({
              ...day,
              date: addDays(day.date, -7),
            }));
            setCurrentWeek(newWeek);
          }}
        >
          &lt;
        </button>
        <div
          className="flex bg-white items-center font-semibold border border-gray-200 px-4 py-1 cursor-pointer"
          onClick={() => dateInputRef.current?.showPicker()}
        >
          {currentWeek &&
            `${format(currentWeek[0].date, "MMM dd, yyyy")} – ${format(
              currentWeek[6].date,
              "MMM dd, yyyy"
            )}`}
        </div>
        <button
          className="border border-gray-200 bg-white px-2 py-1 hover:bg-gray-300"
          onClick={() => {
            if (!currentWeek) return;
            const newWeek = currentWeek.map((day) => ({
              ...day,
              date: addDays(day.date, 7),
            }));
            setCurrentWeek(newWeek);
          }}
        >
          &gt;
        </button>
        {/* hidden native date picker */}
        <input
          ref={dateInputRef}
          type="date"
          className="absolute left-[50px] opacity-0 pointer-events-none"
          defaultValue={
            currentWeek ? format(currentWeek[0].date, "yyyy-MM-dd") : ""
          }
          onChange={handleDateChange}
        />
      </div>

      <div className="mb-4">
        <select
          value={selectedOrganization}
          onChange={handleOrganizationChange}
          className="p-2 border rounded"
          disabled={userRole !== "Admin"} // Disable dropdown for Manager
        >
          <option value="" disabled>
            Choose an organization
          </option>
          {(userRole !== "Admin"
            ? organizations.filter((org) => org.id === userOrganizationId)
            : organizations
          ).map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full">
        <div className="flex">
          <div className="rounded-t-xl overflow-hidden border border-gray-300 w-full">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="w-[20vw] p-4 bg-white border border-gray-300"></th>
                  {currentWeek.map((day) => (
                    <th
                      key={day.date.toISOString()}
                      className="w-[10vw] p-4 bg-white border border-gray-300"
                    >
                      <div
                        className={`flex justify-between ${
                          isSameDay(day.date, new Date()) ? "bg-gray-300" : ""
                        }`}
                      >
                        <div className="mr-7">
                          <h3 className="text-left text-lg font-bold">
                            {format(day.date, "E")}
                          </h3>
                          <p className="font-bold text-sm text-gray-500">
                            {format(day.date, "MMM dd")}
                          </p>
                        </div>
                        <div className="flex items-center p-3">
                          {
                            validScheduledShifts.filter(
                              (shift) =>
                                new Date(shift.date).toDateString() ===
                                day.date.toDateString()
                            ).length
                          }
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="bg-white border border-gray-300 px-4 py-2 font-bold text-left">
                      {employee.name}
                    </td>
                    {currentWeek.map((day) => {
                      const assignedShift = findAssignedShift(
                        employee.id,
                        day.date
                      );
                      if (assignedShift) {
                        return (
                          <td
                            key={day.date.toISOString()}
                            className={`text-sm text-center border border-gray-300 px-4 py-2 ${userRole === "Admin" || userRole === "Manager" ? "cursor-pointer hover:bg-gray-100" : ""}`}
                            onClick={() => {
                              if (userRole === "Admin" || userRole === "Manager") {
                                handleOpenEditModal(assignedShift);
                              }
                            }}                          >
                            {convertTo12Hour(assignedShift.startTime)} –{" "}
                            {assignedShift.endTime === "24:00"
                              ? "12:00 AM"
                              : convertTo12Hour(assignedShift.endTime)}
                          </td>
                        );
                      } else {
                        const employeeAvailabilities =
                          availabilitiesByEmployee[employee.id] || [];
                        const targetDayName = format(day.date, "EEEE");
                        const availabilityForDay =
                          employeeAvailabilities.filter((av) => {
                            const start = new Date(av.effectiveStart);
                            const end = new Date(av.effectiveEnd);
                            return day.date >= start && day.date < end;
                          });
                        const validAvailabilitySlots =
                          availabilityForDay.flatMap((av) =>
                            av.DailyAvailabilitySlot.filter(
                              (slot) => slot.day === targetDayName
                            )
                          );
                        const hasAvailableSlot = validAvailabilitySlots.some(
                          (slot) => slot.available
                        );
                        const hasAvailabilityForDate =
                          availabilityForDay.length > 0;
                        return (
                          <td
                            key={day.date.toISOString()}
                            className={`text-center border border-gray-300 px-4 py-2 ${userRole === "Admin" || userRole === "Manager" &&
                              hasAvailableSlot
                                ? "cursor-pointer hover:bg-gray-100"
                                : ""
                            }`}
                            onClick={() => {
                              if ((userRole === "Admin" || userRole === "Manager") && hasAvailableSlot) {
                                handleCellClick(day, employee);
                            }}}
                          >
                            {hasAvailabilityForDate
                              ? userRole === "Admin" || userRole === "Manager" && hasAvailableSlot
                                ? "Click to assign"
                                : "No schedule"
                              : ""}
                          </td>
                        );
                      }
                    })}
                  </tr>
                ))}
                {(userRole === "Admin" || userRole === "Manager") && (
                <tr>
                  <td className="bg-white border border-gray-300 px-4 py-2 font-bold text-left">
                    <select
                      className="p-2 border rounded"
                      onChange={(e) => {
                        const selectedEmp = uniqueAvailableEmployees.find(
                          (emp) => emp.id === e.target.value
                        );
                        if (selectedEmp) handleAddEmployee(selectedEmp);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Add Employee
                      </option>
                      {uniqueAvailableEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {currentWeek.map((day) => (
                    <td
                      key={day.date.toISOString()}
                      className="bg-white border border-gray-300 px-4 py-2"
                    ></td>
                  ))}
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AvailabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={modalDate}
        employee={modalEmployee}
        availabilityData={modalSlots.map((slot) => ({
          startTime: slot.startTime ?? "00:00",
          endTime: slot.endTime === "24:00" ? "24:00" : slot.endTime ?? "23:59",
          available: slot.available,
        }))}
        onAssign={handleAssign}
      />

      <EditShiftModal
        isOpen={isEditModalOpen}
        shift={shiftToEdit}
        onClose={() => setIsEditModalOpen(false)}
        onUpdate={handleUpdateShift}
      />
    </div>
  );
};

export default Schedules;
