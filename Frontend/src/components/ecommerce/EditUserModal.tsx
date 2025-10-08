import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { User } from "./types.ts";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUpdate }) => {
  const [form, setForm] = useState<User | null>(user);


  const apiUrl = import.meta.env.VITE_API_URL;
  useEffect(() => {
    setForm(user);
  }, [user]);

  if (!isOpen || !form) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form) return;
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${apiUrl}/users/edit/${form._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(form),
      });

      const data = await response.json();


      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }
      //Error updating user. Please try again.


      console.log("User updated:", data);

      // Only update state and close modal after successful API call
      onUpdate(data);
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Error updating user. Please try again.");
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit User</h2>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
          <input
            name="department"
            placeholder="Department"
            value={form.department || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <input
            name="designation"
            placeholder="Designation"
            value={form.designation || ""}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="Admin">Admin</option>
            <option value="Sales">Sales</option>
            <option value="TL">TL</option>
            <option value="Developer">Developer</option>
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
