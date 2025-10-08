// src/pages/StatsPage.tsx
import React, { useEffect, useState, } from "react";
import { useNavigate } from "react-router";

interface Stats {
  total: number;
  completed: number;
  pending: number; 
  delayed: number;
  inProgress: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
  });
  const navigate=useNavigate()
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/tasks/stats`,{
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      console.log("Data",data);
      
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const cards = [
    { label: "Total Tasks", value: stats.total, style: "text-2xl font-bold text-blue-400" },
    { label: "Pending Tasks", value: stats.pending, style: "text-2xl font-bold text-yellow-400" },
    { label: "In-Progress Tasks", value: stats.inProgress, style: "text-2xl font-bold text-purple-400" },
    { label: "Delayed Tasks", value: stats.delayed, style: "text-2xl font-bold text-red-400" },
    { label: "Completed Tasks", value: stats.completed, style: "text-2xl font-bold text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
     <div className="flex justify-end mb-6">
        {/* <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          Logout
        </button> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-gray-800 rounded-lg p-4 text-center shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-medium text-gray-200">{card.label}</h3>
            <p className={card.style || "text-2xl font-bold text-gray-100"}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
