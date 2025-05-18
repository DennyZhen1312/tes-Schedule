import { config } from "dotenv";
import {
  ClerkExpressWithAuth,
  createClerkClient,
  LooseAuthProp,
} from "@clerk/clerk-sdk-node";
import express, { Request, Response } from "express";
import { router as organizationRouter } from "./routes/organization.router";
import cors from "cors";
import { validateUser } from "./middleware/validate-user";
import { router as employeeRouter } from "./routes/employee.router";
import { router as adminRouter } from "./routes/admin.router";
import { router as invitationRouter } from './routes/invitation.router';

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {
      userRole?: string;
      userOrganizationId?: string;
    }
  }
}

config();

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/admin", adminRouter);

// app.use(ClerkExpressWithAuth());

// app.use(validateUser);

app.use("/api/organizations", organizationRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/invitations", invitationRouter);

app.get("/api/user-info", async (req, res) => {
  try {
    const { userRole, userOrganizationId } = req;
    res.status(200).json({ position: userRole, organizationId: userOrganizationId });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send({
    message: "Superbase Prisma server..."
  });
});


app.listen(process.env.PORT, () => {
  console.log(`[server]: Listening at http://localhost:${process.env.PORT}`);
});
