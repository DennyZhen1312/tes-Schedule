import { useEffect, useState } from "react";
import logo from "../assets/logo.png";

import { AiOutlineDashboard } from "react-icons/ai";
import { VscOrganization } from "react-icons/vsc";
import { LiaCalendarAltSolid } from "react-icons/lia";
import { CiStar } from "react-icons/ci";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export function Navbar() {
  const { signOut, getToken } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userOrgId, setUserOrgId] = useState<string | null>(null);

  // Fetch the current user's role and organization on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await getToken();
        const res = await fetch("/api/user-info", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const { position, organizationId } = await res.json();
          setUserRole(position);
          setUserOrgId(organizationId);
        }
      } catch (error) {
        console.error("Failed to fetch user info", error);
      }
    };
    fetchUserInfo();
  }, [getToken]);

  const handleLogout = async () => {
    await signOut(); // Clears the session and logs out
  };

  // Define all possible links
  const allLinks = [
    {
      to: "/dashboard",
      Icon: AiOutlineDashboard,
      label: "Dashboard",
      restricted: true,
    },
    {
      to: "/organizations",
      Icon: VscOrganization,
      label: "Organizations",
      restricted: true,
    },
    {
      to: "/schedules",
      Icon: LiaCalendarAltSolid,
      label: "Schedules",
      restricted: false,
    },
    {
      to: "/availability",
      Icon: CiStar,
      label: "Availability",
      restricted: false,
    },
  ];

  // Only Admin or Manager can see restricted links
  const visibleLinks = allLinks.filter((link) => {
    if (!link.restricted) return true;
    return userRole === "Admin" || userRole === "Manager";
  });

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full z-10 bg-black flex flex-col px-8 py-1">
        <nav className="flex justify-between items-center">
          <img src={logo} alt="App Logo" className="w-20" />

          <div className="flex gap-8">
            {visibleLinks.map(({ to, Icon, label }) => {
              // If Manager clicks "Organizations", redirect to their own org detail
              const linkTo =
                label === "Organizations" && userRole === "Manager" && userOrgId
                  ? `/organizations/${userOrgId}`
                  : to;
              return (
                <NavLink
                  key={label}
                  to={linkTo}
                  className={({ isActive }) =>
                    [
                      "flex flex-col items-center px-3 py-2 rounded-lg transition",
                      isActive
                        ? "bg-gray-800 text-red-500"
                        : "text-white hover:bg-gray-700 hover:text-red-500",
                    ].join(" ")
                  }
                >
                  <Icon className="text-3xl mb-1" />
                  <span className="text-xs">{label}</span>
                </NavLink>
              );
            })}

            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="h-10 w-24 border-2 border-white text-white font-semibold rounded-xl hover:bg-red-500 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
