import { createContext, ReactNode, useContext, useState } from "react";
import { EmployeeType } from "../types/Employee";
import { useAuth } from "@clerk/clerk-react";

type EmployeeContextType = {
  employees: EmployeeType[];
  fetchEmployees: () => void;
};

const EmployeeContext = createContext<EmployeeContextType>({
  employees: [],
  fetchEmployees: () => {},
});

type Props = {
  children: ReactNode;
};

export function EmployeeContextProvider({ children }: Props) {
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const { getToken } = useAuth();

  const fetchEmployees = async () => {
    const token = await getToken();

    try {
      const response = await fetch("/api/employees", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      } else {
        console.error("Failed to employees.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const value = {
    employees,
    fetchEmployees,
  };

  return (
    <EmployeeContext.Provider value={value}>
      {children}
    </EmployeeContext.Provider>
  );
}

export const useEmployees = () => useContext(EmployeeContext);
