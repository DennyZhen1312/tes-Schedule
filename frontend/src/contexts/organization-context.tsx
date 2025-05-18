import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { OrganizationType } from "../types/Organization";
import { useAuth } from "@clerk/clerk-react";

type OrganizationContextType = {
  organizations: OrganizationType[];
  fetchOrganizations: () => void;
  remove: (id: OrganizationType["id"]) => void;
};

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  fetchOrganizations: () => {},
  remove: () => {},
});

type Props = {
  children: ReactNode;
};

export function OrganizationContextProvider({ children }: Props) {
  const [organizations, setOrganizations] = useState<OrganizationType[]>([]);
  const { getToken } = useAuth();

  const fetchOrganizations = async () => {
    const token = await getToken();
    try {
      const response = await fetch("/api/organizations", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      } else {
        console.error("Failed to fetch organizations.");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const remove = async (id: OrganizationType["id"]) => {
    const token = await getToken();
    try {
      const response = await fetch(
        `/api/organizations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setOrganizations((prev) => prev.filter((org) => org.id !== id));
      } else {
        console.error("Failed to delete organization");
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
    }
  };

  const value = {
    organizations,
    fetchOrganizations,
    remove,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganizations = () => useContext(OrganizationContext);
