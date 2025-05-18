import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoutes from "./protected-router";
import RoleSelection from "../pages/RoleSelection";
import AdminSignIn from "../pages/AdminSignIn";
import AdminSignUp from "../pages/AdminSignUp";
import { Navbar } from "../layouts/Navbar";
import { Dashboard } from "../pages/Dashboard";
import { CreateOrganization } from "../components/CreateOrganization";
import Organizations from "../pages/Organizations";
import OrganizationDetails from "../pages/OrganizationDetail";
import Schedules from "../pages/Schedules";
import PublicRoutes from "./public-router";
import PendingRequests from "../components/PendingRequests";
import RoleProtectedRoute from "./role-protected-router";
import { Availability } from "../pages/Availability";
import AddAvailability from "../pages/AddAvailability";
import EmployeeSignUp from "../pages/EmployeeSignUp";
import EmployeeSignIn from "../pages/EmployeeSignIn";

export const router = createBrowserRouter([
  {
    element: <PublicRoutes />, // Wrap protected routes here
    children: [
      {
        path: "/sign-in",
        element: <RoleSelection />, // Default route to RoleSelection
      },
      {
        path: "/admin-signin",
        element: <AdminSignIn />,
      },
      {
        path: "/admin-signup",
        element: <AdminSignUp />,
      },
      {
        path: "/employee-signup",
        element: <EmployeeSignUp />,
      },
      {
        path: "/employee-signin",
        element: <EmployeeSignIn />,
      },
    ],
  },
  {
    element: <ProtectedRoutes />, // Wrap protected routes here
    children: [
      { path: "/", element: <Navigate to="dashboard" /> },

      {
        element: <Navbar />,
        children: [

          {
            path: "/dashboard",
            element: (
              <RoleProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <Dashboard />
              </RoleProtectedRoute>
            ),
            children: [
              {
                path: "",
                element: <Navigate to="create-organization" replace />,
              }, // Redirect to /dashboard/create-organization
              {
                path: "create-organization",
                element: (
                  <RoleProtectedRoute allowedRoles={["Admin"]}>
                    <CreateOrganization />
                  </RoleProtectedRoute>
                ),
              },
              {
                path: "requests",
                element: <PendingRequests />,
              },
            ],
          },
          {
            path: "/organizations",
            element: (
              <RoleProtectedRoute allowedRoles={["Admin", "Manager"]}>
                <Organizations />
              </RoleProtectedRoute>
            ),
          },
          {
            path: "/organizations/:id",
            element: <OrganizationDetails />,
          },
          {
            path: "/schedules",
            element: <Schedules />,
          },
          {
            path: "/availability",
            element: <Availability />,
          },
          {
            path: "/add-availability",
            element: <AddAvailability />,
          },
          {
            path: "/availability/edit/:id",
            element: <AddAvailability />,
          },
          // Add other protected routes here
        ],
      },
    ],
  },
]);
