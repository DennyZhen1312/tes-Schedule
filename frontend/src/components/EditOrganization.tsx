// src/components/EditOrganization.tsx
import { useRef, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { useAuth } from "@clerk/clerk-react";
import { OrganizationType } from "../types/Organization";

type Props = {
  organization: OrganizationType;
  onClose: () => void; // e.g. context.fetchOrganizations
};

export function EditOrganization({ organization, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(organization.name);
  const [location, setLocation] = useState(organization.location);
  const { getToken } = useAuth();

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    const res = await fetch(
      `/api/organizations/${organization.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, location }),
      }
    );
    if (res.ok) {
      onClose();
      close();
    } else {
      console.error("Failed to update organization");
    }
  };

  return (
    <>
      <button
        onClick={open}
        className="text-gray-500 hover:text-blue-500 focus:outline-none"
        aria-label="Edit Organization"
      >
        <FiEdit />
      </button>

      <dialog
        ref={dialogRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg w-96 p-6 shadow-lg z-50"
      >
        <h2 className="text-xl font-semibold mb-4">Edit Organization</h2>
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
            <label className="block mb-1 font-medium">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={close}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Save Changes
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
