import React from "react";
import logo from "../assets/logo.png";

import { AiOutlineDashboard } from "react-icons/ai";
import { VscOrganization } from "react-icons/vsc";
import { LiaCalendarAltSolid } from "react-icons/lia";
import { CiStar } from "react-icons/ci";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export function Navbar() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut(); // Clears the session and logs out
  };

  const links = [
    { to: "/dashboard", Icon: AiOutlineDashboard, label: "Dashboard" },
    { to: "/organizations", Icon: VscOrganization, label: "Organizations" },
    { to: "/schedules", Icon: LiaCalendarAltSolid, label: "Schedules" },
    { to: "/availability", Icon: CiStar, label: "Availability" },
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="w-full z-10 bg-black flex flex-col px-8 py-1">
        <nav className="flex justify-between items-center">
          <img src={logo} alt="App Logo" className="w-20" />

          <div className="flex gap-8">
            {links.map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "flex flex-col items-center px-3 py-2 rounded-lg transition",
                    // base text color

                    // active (selected) state
                    isActive
                      ? "bg-gray-800 text-red-500"
                      : "text-white hover:bg-gray-700 hover:text-red-500",
                  ].join(" ")
                }
              >
                <Icon className="text-3xl mb-1" />
                <span className="text-xs">{label}</span>
              </NavLink>
            ))}

            <button
              onClick={handleLogout}
              className="h-10 w-24 flex items-center justify-center mb-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-red-500 transition"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      <Outlet />
    </div>
  );
}
