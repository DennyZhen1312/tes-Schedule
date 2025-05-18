import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getAllOrganizations = async (req: Request, res: Response) => {
  const organizations = await prisma.organization.findMany();

  res.json(organizations);
};

export const getOrganizationDetails = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const organizationDetails = await prisma.organization.findUnique({
      where: { id },
      include: {
        employees: {
          orderBy: { createdAt: "asc" }, // Ensures consistent order
        },
      },
    });
    res.json(organizationDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch organization details" });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  const { name, location } = req.body;
  const newOrganization = await prisma.organization.create({
    data: {
      name,
      location,
    },
  });
  res.status(201).json(newOrganization);
};

export const updateOrganization = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    const updated = await prisma.organization.update({
      where: { id },
      data: { name, location },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update organization" });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.organization.delete({
      where: { id },
    });
    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete organization" });
  }
};
