import { Router } from "express";
import {
  addAvailability,
  addEmployee,
  approveRequest,
  assignScheduledShift,
  deleteAvailability,
  deleteEmployee,
  getAllAvailabilities,
  getAllEmployees,
  getAllPendingRequest,
  getAvailabilityByOrganization,
  getEachAvailabilities,
  getEmployeeByEmail,
  getScheduledShiftsByOrganization,
  loggedUser,
  reactivateEmployee,
  rejectRequest,
  updateAvailability,
  updateEmployee,
  updateScheduledShift,
} from "../controllers/employeecontroller";

export const router = Router();

router.get("/", getAllEmployees);
router.get("/logged-user", loggedUser);
router.post("/", addEmployee);
router.post("/by-email", getEmployeeByEmail);
router.post("/reactivate", reactivateEmployee);
router.put("/:id", updateEmployee); // Add this line for updating an employee
router.delete("/:id", deleteEmployee); // Add this line for updating an employee

router.get("/pending-requests", getAllPendingRequest);
router.post("/pending-requests/:id", approveRequest);
router.delete("/pending-requests/:id", rejectRequest);

router.get("/availabilities", getAllAvailabilities);
router.get("/availabilities/:id", getEachAvailabilities);
router.post("/availabilities", addAvailability);
router.put("/availabilities/:id", updateAvailability); // New PUT route
router.delete("/availabilities/:id", deleteAvailability);

router.get("/availabilities-by-organization", getAvailabilityByOrganization);

router.get("/scheduled-shifts", getScheduledShiftsByOrganization);
router.post("/scheduled-shifts", assignScheduledShift);
router.put("/scheduled-shifts/:id", updateScheduledShift);

