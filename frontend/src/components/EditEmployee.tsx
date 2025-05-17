import { useRef, useState } from "react";
import { EmployeeType } from "../types/Employee";
import { FiEdit } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";

type EditEmployeeProps = {
  employee: Omit<EmployeeType, "organizationId">;
  organizationName: string;
  onUpdate: (updatedEmployee: {
    id: string;
    name: string;
    email: string;
    position: string;
    isActive:boolean;
  }) => void; // Callback to update the employee list
};

export function EditEmployee({
  employee,
  organizationName,
  onUpdate,
}: EditEmployeeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [name, setName] = useState(employee.name);
  const [email, setEmail] = useState(employee.email);
  const [position, setPosition] = useState(employee.position);
  const { getToken } = useAuth();

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();

    try {
      const response = await fetch(
        `/api/employees/${employee.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: employee.id, name, email, position }),
        }
      );

      if (response.ok) {
        const updatedEmployee = await response.json();
        onUpdate(updatedEmployee);
        closeModal();
      } else {
        console.error("Failed to update employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error);
    }
  };

  return (
    <>
      <button
        onClick={openModal}
        className="text-gray-500 hover:text-blue-500"
        aria-label="Edit Employee"
      >
        <FiEdit />
      </button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 transform -translate-x-1/2 rounded-lg w-96 p-6 bg-white shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4">Edit Employee</h2>
        <p className="text-gray-600 mb-4">
          Edit employee details for {employee.name} at {organizationName}.
        </p>
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
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Update Employee
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
