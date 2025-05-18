import { Router } from "express";
import { addAdmin } from "../controllers/admincontroller";

export const router = Router();

router.post("/", addAdmin);
