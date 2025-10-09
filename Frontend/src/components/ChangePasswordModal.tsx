import { useState } from "react";

interface Props {
  userId?: string;
  onClose: () => void;
}

export default function ChangePasswordModal({  onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return; 
    }
    setLoading(true);
    try {
     
      const res = await fetch(
        `${apiUrl}/users/change-password`,
        {
         method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // send HTTP-only cookie
      body: JSON.stringify({ currentPassword, newPassword }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully!");
        onClose();
      } else {
        alert(data.message || "Error changing password");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-80 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Change Password
        </h2>
        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 mb-3 border rounded dark:bg-gray-700 dark:text-white"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
