import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { clerkClient } from "../server";

const prisma = new PrismaClient();

export const getAllEmployees = async (req: Request, res: Response) => {
  const { userRole, userOrganizationId } = req;

  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      organizationId: userRole === "Manager" ? userOrganizationId : undefined,
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(employees);
};

export const loggedUser = async (req: Request, res: Response) => {
  const clerkId = req.auth?.userId!;
  const user = await clerkClient.users.getUser(clerkId);
  const clerkEmail = user.emailAddresses[0].emailAddress;

  const dbUser = await prisma.employee.findUnique({
    where: { email: clerkEmail },
  });

  res.json(dbUser);
};

export const getEmployeeByEmail = async (req: Request, res: Response) => {
  const { email } = req.body; // Expect email in the request body

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { email },
    });

    if (employee) {
      res
        .status(200)
        .json({ exists: true, isActive: employee.isActive, employee });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error("Error fetching employee by email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addEmployee = async (req: Request, res: Response) => {
  const { name, email, position, organizationId } = req.body;
  const { userRole } = req;

  try {
    if (userRole === "Manager") {
      // Add to PendingRequest instead of Employee
      const pendingRequest = await prisma.pendingRequest.create({
        data: { name, email, position, organizationId },
      });

      res.status(201).json({
        message: "Request added to pending list for admin approval.",
        request: pendingRequest,
      });
      return; // Exit after response
    }

    // If not a Manager, directly add employee
    const employee = await prisma.employee.create({
      data: { name, email: email.toLowerCase(), position, organizationId },
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error("Error adding employee:", error);

    // Always respond with an error message and exit
    res.status(500).json({ error: "Failed to add employee" });
    return;
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, position } = req.body;

  try {
    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: { name, email, position },
    });

    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Instead of deleting, mark the employee as inactive (soft delete)
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });
    res.status(200).json({ message: "Employee deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating employee:", error);
    res.status(500).json({ error: "Failed to deactivate employee" });
  }
};

export const reactivateEmployee = async (req: Request, res: Response) => {
  const { email } = req.body; // Expect email in the request body

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  try {
    // First, ensure that an employee exists with the provided email.
    const employee = await prisma.employee.findUnique({
      where: { email },
    });
    if (!employee) {
      res.status(404).json({ error: "Employee not found." });
      return;
    }

    // Update the employee to set isActive to true.
    const updatedEmployee = await prisma.employee.update({
      where: { email },
      data: { isActive: true },
    });

    res.status(200).json({
      message: "Employee reactivated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error reactivating employee:", error);
    res.status(500).json({ error: "Failed to reactivate employee" });
  }
};

export const getAllPendingRequest = async (req: Request, res: Response) => {
  const { userRole, userOrganizationId } = req;

  const pendingRequests = await prisma.pendingRequest.findMany({
    where: userRole === "Manager" ? { organizationId: userOrganizationId } : {}, // Filter by organizationId if Manager
    orderBy: { createdAt: "asc" }, // Ensures consistent order
  });

  res.json(pendingRequests);
};

export const approveRequest = async (req: Request, res: Response) => {
  const { id } = req.params; // Pending request ID

  try {
    const pendingRequest = await prisma.pendingRequest.findUnique({
      where: { id },
    });

    if (!pendingRequest) {
      res.status(404).json({ error: "Pending request not found." });
      return;
    }

    // Move to Employee table
    const employee = await prisma.employee.create({
      data: {
        name: pendingRequest.name,
        email: pendingRequest.email.toLowerCase(),
        position: pendingRequest.position,
        organizationId: pendingRequest.organizationId,
      },
    });

    // Send an invitation via Clerk
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: pendingRequest.email,
    });

    // Delete the pending request from the database
    await prisma.pendingRequest.delete({ where: { id } });

    res.status(200).json({
      message: "Request approved and removed from pending list.",
      employee,
      invitation,
    });
  } catch (error) {
    console.error("Error approving request:", error);
    res.status(500).json({ error: "Failed to approve request." });
  }
};

export const rejectRequest = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Delete the pending request
    await prisma.pendingRequest.delete({ where: { id } });

    res.status(200).json({ message: "Request rejected successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reject request." });
  }
};

export const getAllAvailabilities = async (req: Request, res: Response) => {
  try {
    const availabilities = await prisma.availability.findMany({
      include: {
        employee: true,
        DailyAvailabilitySlot: true, // Include the DailyAvailabilitySlot records here
      },
      orderBy: { effectiveStart: "asc" },
    });
    res.json(availabilities);
  } catch (error) {
    console.error("Error fetching availabilities:", error);
    res.status(500).json({ error: "Failed to fetch availabilities" });
  }
};

export const getEachAvailabilities = async (req: Request, res: Response) => {
  const { id } = req.params; // Extract ID from request parameters

  try {
    const availability = await prisma.availability.findUnique({
      where: { id },
      include: {
        employee: true, // Include employee details if needed
        DailyAvailabilitySlot: true, // Include daily availability slots
      },
    });

    if (!availability) {
      res.status(404).json({ error: "Availability not found" });
      return;
    }

    res.status(200).json(availability);
  } catch (error) {
    console.error("Error fetching availability by ID:", error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
};

export const addAvailability = async (req: Request, res: Response) => {
  console.log("Request Body:", JSON.stringify(req.body, null, 2));

  const { employeeId, effectiveStart, effectiveEnd, availability } = req.body;

  try {
    const newAvailability = await prisma.availability.create({
      data: {
        employeeId,
        effectiveStart: new Date(effectiveStart),
        effectiveEnd: new Date(effectiveEnd),
        DailyAvailabilitySlot: {
          create: availability.map(
            (slot: {
              day: string;
              allDay: boolean;
              available: boolean;
              startTime: string;
              endTime: string;
            }) => ({
              day: slot.day,
              allDay: slot.allDay,
              available: slot.allDay ? true : slot.available,
              startTime: slot.allDay ? "09:00" : slot.startTime,
              endTime: slot.allDay ? "24:00" : slot.endTime,
            })
          ),
        },
      },
      include: {
        DailyAvailabilitySlot: true,
      },
    });
    res.status(201).json(newAvailability);
  } catch (error) {
    console.error("Error adding availability:", error);
    res.status(500).json({ error: "Failed to add availability" });
  }
};

export const updateAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { employeeId, effectiveStart, effectiveEnd, availability } = req.body;

  try {
    // Delete existing DailyAvailabilitySlot records associated with the availability record.
    await prisma.dailyAvailabilitySlot.deleteMany({
      where: { availabilityId: id },
    });

    // Update the availability record and re-create the DailyAvailabilitySlot records.
    const updatedAvailability = await prisma.availability.update({
      where: { id },
      data: {
        employeeId,
        effectiveStart: new Date(effectiveStart),
        effectiveEnd: new Date(effectiveEnd),
        DailyAvailabilitySlot: {
          create: availability.map(
            (slot: {
              day: string;
              allDay: boolean;
              available: boolean;
              startTime: string;
              endTime: string;
            }) => ({
              day: slot.day,
              allDay: slot.allDay,
              available: slot.allDay ? true : slot.available,
              startTime: slot.allDay ? "09:00" : slot.startTime,
              endTime: slot.allDay ? "24:00" : slot.endTime,
            })
          ),
        },
      },
      include: {
        DailyAvailabilitySlot: true,
      },
    });

    res.status(200).json(updatedAvailability);
  } catch (error) {
    console.error("Error updating availability:", error);
    res.status(500).json({ error: "Failed to update availability" });
  }
};

export const deleteAvailability = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // First, delete all DailyAvailabilitySlot records for this availability
    await prisma.dailyAvailabilitySlot.deleteMany({
      where: { availabilityId: id },
    });
    // Now delete the availability record itself
    await prisma.availability.delete({
      where: { id },
    });
    res.status(200).json({ message: "Availability deleted successfully" });
  } catch (error) {
    console.error("Error deleting availability:", error);
    res.status(500).json({ error: "Failed to delete availability" });
  }
};

export const getAvailabilityByOrganization = async (
  req: Request,
  res: Response
) => {
  const { organizationId } = req.query;

  try {
    const availabilities = await prisma.availability.findMany({
      where: {
        employee: {
          organizationId: organizationId as string,
        },
      },
      include: { employee: true },
    });
    res.status(200).json(availabilities);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
};

export const assignScheduledShift = async (req: Request, res: Response) => {
  const { employeeId, date, startTime, endTime } = req.body;

  try {
    // Create a new scheduled shift in the database
    const scheduledShift = await prisma.scheduledShift.create({
      data: {
        employeeId,
        date: new Date(date), // Ensure the date is in the correct format
        startTime,
        endTime,
      },
    });

    res.status(201).json(scheduledShift);
  } catch (error) {
    console.error("Error assigning scheduled shift:", error);
    res.status(500).json({ error: "Failed to assign scheduled shift" });
  }
};

export const updateScheduledShift = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startTime, endTime } = req.body;
  try {
    const updatedShift = await prisma.scheduledShift.update({
      where: { id },
      data: { startTime, endTime },
    });
    res.status(200).json(updatedShift);
  } catch (error) {
    console.error("Error updating scheduled shift:", error);
    res.status(500).json({ error: "Failed to update scheduled shift" });
  }
};

// Add this to employeecontroller.ts

export const getScheduledShiftsByOrganization = async (
  req: Request,
  res: Response
) => {
  const { organizationId } = req.query;

  try {
    const shifts = await prisma.scheduledShift.findMany({
      where: {
        employee: {
          organizationId: organizationId as string,
        },
      },
      include: {
        employee: true,
      },
    });

    res.status(200).json(shifts);
  } catch (error) {
    console.error("Error fetching scheduled shifts:", error);
    res.status(500).json({ error: "Failed to fetch scheduled shifts" });
  }
};
