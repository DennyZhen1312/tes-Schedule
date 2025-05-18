// src/router/role-protected-router.tsx
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

type RoleProtectedRouteProps = {
  children: JSX.Element;
  allowedRoles: string[]; // e.g. ["Admin"], ["Admin","Manager"], etc.
};

export default function RoleProtectedRoute({
  children,
  allowedRoles,
}: RoleProtectedRouteProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
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
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };

    fetchUserRole();
  }, [getToken]);

  if (!userRole) {
    return <p>Loading...</p>;
  }

  // If they're not one of the allowedRoles...
  if (!allowedRoles.includes(userRole)) {
    // ...but *are* a Manager, send them to their Requests tab
    if (userRole === "Manager") {
      return <Navigate to="/dashboard/requests" replace />;
    }
    // ...otherwise (employees, etc.) send them to Availability
    return <Navigate to="/schedules" replace />;
  }

  // If their role *is* allowed, render the protected content
  return children;
}
