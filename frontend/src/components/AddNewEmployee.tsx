import { useAuth } from "@clerk/clerk-react";
import { useRef, useState } from "react";
import { EmployeeType } from "../types/Employee";

type AddNewEmployeeProps = {
  organizationId?: string;
  onAdd: (newEmployee: EmployeeType) => void;
};

export function AddNewEmployee({ organizationId, onAdd }: AddNewEmployeeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const { getToken } = useAuth();

  const openModal = () => dialogRef.current?.showModal();
  const closeModal = () => dialogRef.current?.close();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();

    // Check for existing employee by email
    const checkResp = await fetch(
      "/api/employees/by-email",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const check = await checkResp.json();

    // If email exists and is active, alert and stop
    if (check.exists && check.isActive) {
      alert("An employee with this email already exists. Please use a different email or update the existing employee's information.");
      return;
    }

    // If exists but inactive, reactivate
    if (check.exists && !check.isActive) {
      const reactResp = await fetch(
        "/api/employees/reactivate",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const { employee } = await reactResp.json();
      onAdd(employee);
      closeModal();
      return;
    }

    // Normal add
    const resp = await fetch("/api/employees", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, position, organizationId }),
    });
    const result = await resp.json();
    if (resp.ok) {
      if (result.request) {
        alert("Request submitted for admin approval.");
      } else {
        onAdd(result);
        // send invitation
        await fetch("/api/invitations", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ emailAddress: email }),
        });
      }
      closeModal();
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="bg-black text-white py-2 px-4 rounded hover:bg-gray-700 transition"
      >
        + Add New Employee
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 rounded-lg w-96 p-6 bg-white shadow-lg text-left z-50"
      >
        <h2 className="text-xl font-semibold mb-4">Add New Employee</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Position</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={closeModal}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Add Employee
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
