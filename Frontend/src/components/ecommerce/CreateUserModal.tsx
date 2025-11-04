import React, { useState, ChangeEvent, FormEvent } from "react";

interface UserForm {
  name: string;
  email: string;
  password: string;
  department: string;
  designation:string;
  role: "Admin" | "Sales" | "TL" | "Developer" |"Manager";
  slackId?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (user: UserForm) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState<UserForm>({
    name: "",
    email: "",
    password: "",
    department: "",
    designation:"",
    role: "Developer",
    slackId: "",
  });

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};
 const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    // Call the onCreate callback first (optional, if you want local state update)
    onCreate(form);

    // Send data to your backend
    const response = await fetch(`${apiUrl}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create user");
    }
    localStorage.setItem("token", data.token);

    console.log("User created:", data);

    // Reset form after successful creation
    setForm({ name: "", email: "", password: "", department: "",designation:"", role: "Developer" ,slackId:""});

    // Close the modal
    onClose();
  } catch (error) {
    console.error("Error creating user:", error);
    alert("Failed to create user. Please try again.");
  }
};

  if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-30">
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        Create New User
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
          required
        />

        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
        />

        <input
          name="designation"
          placeholder="Designation"
          value={form.designation}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
          required
        >
          <option value="" hidden>Select Role</option>
          <option value="Admin">Admin</option>
          <option value="Sales">Sales</option>
          <option value="TL">Team Lead</option>
           <option value="Manager">Manager</option>
          <option value="Developer">Developer</option>
        </select>
        <input
          name="slackId"
          placeholder="Slack ID"
          value={form.slackId}
          onChange={handleChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  </div>
);

};

export default CreateUserModal;
