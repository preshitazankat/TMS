// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import { FiEye, FiEdit2, FiSend } from "react-icons/fi";

interface User {
  _id: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  role?: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetch(`${apiUrl}/users/all`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));

  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase()) ||
        u.designation?.toLocaleLowerCase().includes(searchText.toLowerCase()) ||
        (u.department?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
        (u.role?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
    );
  }, [users, searchText]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditOpen(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map((u) => (u._id === updatedUser._id ? updatedUser : u)));
  };

  return (
    <>
      {/* Page Meta + Breadcrumb */}
      <PageMeta title="Admin Dashboard" description="Manage Users" />
      <PageBreadcrumb items={[{ title: "Home", path: "/" }, { title: "Users", path: "/admin" }]} />

      {/* Dashboard content with optional blur */}
      <div className={`relative z-10 transition-all duration-300 ${isCreateOpen || isEditOpen ? "filter blur-sm" : ""}`}>
        {/* Search + Add User */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, department or designation"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-grow w-full md:w-80 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
          <button
            onClick={() => setCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            + Add User
          </button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 dark:bg-gray-800/50">
              <tr>
                {["Sr", "Name", "Email", "Department", "Designation", "Role", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50  transition-colors text-gray-800"
                >
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 ">{idx + 1}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">{user.name}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">{user.email}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">{user.department}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">{user.designation}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">{user.role}</td>
                  <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">



                    <FiEdit2
                      onClick={() => handleEditClick(user)}
                      className="cursor-pointer text-yellow-500 hover:text-yellow-600"
                      title="Edit"
                      size={20}
                    />

                  </td>
                </tr>


              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlay behind modal */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-md transition-opacity duration-300"></div>
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(newUser) => {
          setUsers([...users, { ...newUser, _id: Date.now().toString() }]);
          setCreateOpen(false);
        }}
      />
      <EditUserModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        user={selectedUser}
        onUpdate={handleUpdateUser}
      />
    </>
  );
};

export default AdminDashboard;
