import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "../hooks/useAuth"; // current logged-in user

interface UserProfileProps {}

interface User {
  tasksPending: number;
  tasksCompleted: number;
  tasksAssigned: number;
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  joinedAt?: string;
}

const UserProfile: React.FC<UserProfileProps> = () => {
  const { id } = useParams<{ id: string }>(); // userId from route
  const {token}=useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/profile/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setUser(data.user || data); // adapt to API response
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, token]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
      <div className="flex flex-col md:flex-row items-center gap-6">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border-2 border-blue-600"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">{user.name}</h2>
          <p className="text-gray-500 dark:text-gray-300">{user.role}</p>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{user.email}</p>
          {user.phone && <p className="text-gray-600 dark:text-gray-400">📞 {user.phone}</p>}
          {user.joinedAt && (
            <p className="text-gray-400 text-sm mt-1">
              Joined: {new Date(user.joinedAt).toLocaleDateString()}
            </p>
          )}
        </div> 
      </div>

      {/* Optional: User Stats / Tasks */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <h3 className="text-gray-700 dark:text-white font-semibold">Tasks Assigned</h3>
          <p className="text-blue-600 dark:text-blue-400 font-bold">{user.tasksAssigned || 0}</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <h3 className="text-gray-700 dark:text-white font-semibold">Tasks Completed</h3>
          <p className="text-green-600 dark:text-green-400 font-bold">{user.tasksCompleted || 0}</p>
        </div>
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <h3 className="text-gray-700 dark:text-white font-semibold">Tasks Pending</h3>
          <p className="text-yellow-600 dark:text-yellow-400 font-bold">{user.tasksPending || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
