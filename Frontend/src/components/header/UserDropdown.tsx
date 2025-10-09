import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import ChangePasswordModal from "../../components/ChangePasswordModal"; // mini modal component
import { useNavigate } from "react-router";
import { jwtDecode } from "jwt-decode";

export default function UserDropdown() {
  const { user,logout } = useAuth(); // fetch user from auth context
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;


  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const openPasswordModal = () => {
    setIsPasswordModalOpen(true);
    closeDropdown(); 
  };

  const handleLogout = async () => {
  // try {
  //   // Call backend logout route
  //   await fetch(`${apiUrl}/users/logout`, {
  //     method: "POST",
  //     credentials: "include", // important for cookies
  //   });

  //   // Redirect to login page
  //   navigate("/login");
  // } catch (err) {
  //   console.error("Logout failed", err);
  // }
  logout()
};

  

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400"
      >
        

<span className="mr-3 overflow-hidden rounded-full h-11 w-11 bg-blue-600 flex items-center justify-center text-white text-lg font-semibold">
  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
</span>
<span className="block font-medium">{user?.name}</span>

        <svg
          className={`ml-2 stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
          <ul className="flex flex-col py-2">
            <li>
              <button
                onClick={openPasswordModal}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Change Password
              </button>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Mini Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
          // userId={user?.id}
        />
      )}
    </div>
  );
}
