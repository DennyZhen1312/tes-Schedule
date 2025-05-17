import { Router } from "express";
import { createOrganization, deleteOrganization, getAllOrganizations, getOrganizationDetails, updateOrganization } from "../controllers/organizationcontroller";

export const router = Router();

router.get("/", getAllOrganizations);
router.get("/:id", getOrganizationDetails);
router.post("/", createOrganization);
router.put("/:id", updateOrganization);
router.delete("/:id", deleteOrganization)
