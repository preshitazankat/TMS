import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FiClipboard, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiBox } from "react-icons/fi";

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
  delayed: number;
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
  const [sortBy, setSortBy] = useState<keyof DeveloperTask | "total" | "completed" | "inProgress" | "inRD" | "delayed" | "assigned" | "none">("none");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    if (!token) {
      navigate("/login");
      return;
    }

    const init = async () => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
        await fetchStats(token);
        await fetchDevelopers(token);
        // if (payload.role === "Manager") fetchDevelopers(token);
      } catch (err) {
        console.error("Invalid token", err);
        navigate("/login");
      }
    };

    init();
  }, []);


  const cards = [
    { label: "Total Platform", value: stats.total, icon: <FiClipboard />, bgColor: "bg-blue-50", textColor: "text-gray-500" },
    { label: "Pending Platform", value: stats.pending, icon: <FiClock />, bgColor: "bg-yellow-50", textColor: "text-gray-500" },
    { label: "In-Progress Platform", value: stats.inProgress, icon: <FiPlay />, bgColor: "bg-purple-50", textColor: "text-gray-500" },
    { label: "Delayed Platform", value: stats.delayed, icon: <FiAlertCircle />, bgColor: "bg-red-50", textColor: "text-gray-500" },
    { label: "Completed Platform", value: stats.completed, icon: <FiCheckCircle />, bgColor: "bg-green-50", textColor: "text-gray-500" },
    { label: "In-R&D", value: stats.inRD, icon: <FiBox />, bgColor: "bg-orange-50", textColor: "text-gray-500" },
  ];

  const sortedDevelopers = [...developers].sort((a, b) => {
    if (sortBy === "none") return 0;
    const aValue = (a as any)[sortBy] || 0;
    const bValue = (b as any)[sortBy] || 0;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  return (
    <div className="min-h-screen p-6">
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`${card.bgColor}  rounded-lg p-4 text-center shadow hover:shadow-lg transition text-black`}

          >

            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{card.icon}</span>
              <h3 className="text-lg font-medium">{card.label}</h3>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>



      {/* Developer Table (Manager only) */}
      {(userRole === "Admin" || userRole === "Manager") && developers.length > 0 && (
        <div className="overflow-x-auto bg-gray-100 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Developer Summary</h2>
          <table className="w-full border-collapse bg-white">
            <thead className="bg-gray-300">
              <tr>
                <th className="border px-4 py-2">No.</th>
                <th className="border px-4 py-2">Name</th>
                {["total", "completed", "inProgress", "inRD", "delayed"].map((col) => (
                  <th
                    key={col}
                    className="border px-4 py-2 cursor-pointer"
                    onClick={() => {
                      if (sortBy === col) {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSortBy(col as keyof DeveloperTask);
                        setSortOrder("desc");
                      }
                    }}
                  >
                    {col === "total" ? "Assigned" : col === "inProgress" ? "In Progress" : col === "inRD" ? "In R&D" : col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortBy === col ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {sortedDevelopers.map((dev, idx) => (
                <tr key={idx} className="hover:bg-gray-100 text-center">
                  <td className="border px-4 py-2">{idx + 1}</td> {/* Auto number */}
                  <td className="border px-4 py-2">{dev.name}</td>
                  <td className="border px-4 py-2">{dev.total}</td>
                  <td className="border px-4 py-2">{dev.completed}</td>
                  <td className="border px-4 py-2">{dev.inProgress}</td>
                  <td className="border px-4 py-2">{dev.inRD}</td>
                  <td className="border px-4 py-2">{dev.delayed}</td>
                </tr>
              ))}
              <tr className="bg-gray-200 font-bold text-center">
                <td className="border px-4 py-2"></td>
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
                <td className="border px-4 py-2">
                  {developers.reduce((sum, dev) => sum + dev.delayed, 0)}
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
