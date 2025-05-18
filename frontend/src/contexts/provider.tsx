import { ClerkProvider } from "./clerk-provider";
import { EmployeeContextProvider } from "./employee-context";
import { OrganizationContextProvider } from "./organization-context";
import { RouterProvider } from "./router-provider";

export function Providers() {
  return (
    <ClerkProvider>
      <OrganizationContextProvider>
        <EmployeeContextProvider>
          <RouterProvider />
        </EmployeeContextProvider>
      </OrganizationContextProvider>
    </ClerkProvider>
  );
}
