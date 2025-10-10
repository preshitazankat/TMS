import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { User } from "./types.ts";
import { jwtDecode } from "jwt-decode";

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
    
    try {
      const response = await fetch(`${apiUrl}/users/edit/${form._id}`, {
        method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // send HTTP-only cookie automatically
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
  <div className="fixed inset-0  bg-opacity-40 flex items-center justify-center z-30">
    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Edit User</h2>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <input
          name="department"
          placeholder="Department"
          value={form.department || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="designation"
          placeholder="Designation"
          value={form.designation || ""}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="Admin">Admin</option>
          <option value="Sales">Sales</option>
          <option value="TL">TL</option>
          <option value={"Manager"}>Manager</option>
          <option value="Developer">Developer</option>
        </select>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
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
