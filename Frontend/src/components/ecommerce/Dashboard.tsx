import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface DomainStats {
  total: number;
  pending: number;
  "in-progress": number;
  delayed: number;
  "in-R&D": number;
  submitted: number;
}

interface Stats {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
  inProgress: number;
  inRD: number;
}

interface DeveloperTask {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  inRD: number;
}

const Dashboard: React.FC = () => {
  const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>({});
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
    inRD: 0,
  });
  const [developers, setDevelopers] = useState<DeveloperTask[]>([]);
  console.log("nkodvm", developers)
  const [userRole, setUserRole] = useState<string>("");
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch(`${apiUrl}/tasks/stats`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data: Record<string, DomainStats> = await res.json();

      setDomainStats(data);

      // Compute totals
      let total = 0,
        pending = 0,
        inProgress = 0,
        delayed = 0,
        inRD = 0,
        completed = 0;

      Object.values(data).forEach((d) => {
        total += d.total || 0;
        pending += d.pending || 0;
        inProgress += d["in-progress"] || 0;
        delayed += d.delayed || 0;
        inRD += d["in-R&D"] || 0;
        completed += d.submitted || 0;
      });

      setStats({ total, pending, inProgress, delayed, inRD, completed });
    } catch (err) {
      console.error("Stats fetch error:", err);
    }
  };



  const fetchDevelopers = async (token: string) => {
    try {
      const res = await fetch(`${apiUrl}/tasks/developers`, {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch developers");
      const data: DeveloperTask[] = await res.json();
      console.log("Data", data);
      setDevelopers(data);

    } catch (err) {
      console.error("Developer fetch error:", err);
    }
  };

  useEffect(() => {
    const token = getCookie("token");
    if (!token) return navigate("/login");

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
      fetchStats(token);
      fetchDevelopers(token);
      // if (payload.role === "Manager") fetchDevelopers(token);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, []);
  

  const cards = [
    { label: "Total Tasks", value: stats.total, bgColor: "bg-blue-500" },
    { label: "Pending Tasks", value: stats.pending, bgColor: "bg-yellow-500" },
    { label: "In-Progress Tasks", value: stats.inProgress, bgColor: "bg-purple-500" },
    { label: "Delayed Tasks", value: stats.delayed, bgColor: "bg-red-500" },
    { label: "Completed Tasks", value: stats.completed, bgColor: "bg-green-500" },
    { label: "In-R&D", value: stats.inRD, bgColor: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg transition text-white`}
          >
            <h3 className="text-lg font-medium">{card.label}</h3>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

     

      {/* Developer Table (Manager only) */}
      {userRole === "Manager" && developers.length > 0 && (
      <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Developer Summary</h2>
        <table className="w-full border-collapse">
          <thead className="bg-yellow-300">
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Assigned</th>
              <th className="border px-4 py-2">Completed</th>
              <th className="border px-4 py-2">In Progress</th>
              <th className="border px-4 py-2">In R&D</th>
            </tr>
          </thead>
          <tbody>
            {developers.map((dev, idx) => (
              <tr key={idx} className="hover:bg-gray-100 text-center">
                <td className="border px-4 py-2">{dev.name}</td>
                <td className="border px-4 py-2">{dev.total}</td>
                <td className="border px-4 py-2">{dev.completed}</td>
                <td className="border px-4 py-2">{dev.inProgress}</td>
                <td className="border px-4 py-2">{dev.inRD}</td>
              </tr>
            ))}
            <tr className="bg-gray-200 font-bold text-center">
          <td className="border px-4 py-2">Total</td>
          <td className="border px-4 py-2">
            {developers.reduce((sum, dev) => sum + dev.total, 0)}
          </td>
          <td className="border px-4 py-2">
            {developers.reduce((sum, dev) => sum + dev.completed, 0)}
          </td>
          <td className="border px-4 py-2">
            {developers.reduce((sum, dev) => sum + dev.inProgress, 0)}
          </td>
          <td className="border px-4 py-2">
            {developers.reduce((sum, dev) => sum + dev.inRD, 0)}
          </td>
        </tr>
          </tbody>
        </table>
      </div>
       )} 
       
      
    </div>
  );
};

export default Dashboard;
