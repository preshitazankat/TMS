import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
interface Props {
  userId?: string;
  onClose: () => void;
}

export default function ChangePasswordModal({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
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
        toast.success("Password changed successfully ");

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          onClose();

          // Logout user
          fetch(`${apiUrl}/users/logout`, {
            method: "POST",
            credentials: "include",
          });

          // Redirect to login
          window.location.href = "/login";
        }, 2000); // 2 seconds delay
      }
      else {
        toast.error(data.message || "Error changing password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <ToastContainer position="top-center" autoClose={2000} />
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-96 shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Change Password
        </h2>

        {/* Current Password */}
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Current Password
        </label>
        <div className="relative mb-3">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Enter current password"
          />
          <button
            className="absolute right-2 top-2 text-gray-500"
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* New Password */}
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          New Password
        </label>
        <div className="relative mb-3">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Enter new password"
          />
          <button
            className="absolute right-2 top-2 text-gray-500"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm Password */}
        <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
          Confirm New Password
        </label>
        <div className="relative mb-4">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
            placeholder="Confirm new password"
          />
          <button
            className="absolute right-2 top-2 text-gray-500"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
