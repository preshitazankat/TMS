
// import React, { useState, useEffect, useMemo } from "react";
// import PageMeta from "../common/PageMeta";
// import PageBreadcrumb from "../common/PageBreadCrumb";
// import { useNavigate } from "react-router";
// import { format } from "date-fns";
// import { useAuth } from "../../hooks/useAuth";
// import Cookies from 'js-cookie';
// import { jwtDecode } from "jwt-decode";

// interface Stats {
//   total: number;
//   completed: number;
//   pending: number;
//   delayed: number;
//   inProgress: number;
// }

// interface Task {
//   domain?: string[];
//   srNo: number;
//   projectCode: string;
//   title: string;
//   assignedBy: string;
//   assignedTo: string;
//   assignedDate: string;
//   completionDate: string;
//   platform: string;
//   developers?: { [domain: string]: string[] };
//   status: string;
// }

// interface TokenPayload {
//   id: string;
//   email: string;
//   role: string;
//   name?: string;
//   exp?: number;
// }


// const TaskPage: React.FC = () => {
//   const [tasks, setTasks] = useState<Task[]>([]);
//   const [searchText, setSearchText] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const { role } = useAuth();
//   const [stats, setStats] = useState<Stats>({
//     total: 0,
//     completed: 0,
//     pending: 0,
//     delayed: 0,
//     inProgress: 0,
//   });


//   const getCookie = (name: string): string | null => {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
//     return null;
//   };


//   const fetchStats = async () => {
//     try {
//       const res = await fetch(`${apiUrl}/tasks/stats`, {
//         method: "GET",
//         headers: { Authorization: token ? `Bearer ${token}` : "" },
//         credentials: "include",
//       });
//       if (!res.ok) throw new Error("Failed to fetch stats");
//       const data = await res.json();
//       console.log("Data", data);

//       setStats(data);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, []);




//   const cards = [
//     { label: "Total Tasks", value: stats.total, style: "text-2xl font-bold text-blue-400" },
//     { label: "Pending Tasks", value: stats.pending, style: "text-2xl font-bold text-yellow-400" },
//     { label: "In-Progress Tasks", value: stats.inProgress, style: "text-2xl font-bold text-purple-400" },
//     { label: "Delayed Tasks", value: stats.delayed, style: "text-2xl font-bold text-red-400" },
//     { label: "Completed Tasks", value: stats.completed, style: "text-2xl font-bold text-green-400" },
//   ];

//   console.log(role);
//   const token = getCookie("token");


//   if (token) {
//     const decoded = jwtDecode<TokenPayload>(token);
//     console.log("Decoded user info:", decoded);
//   }

//   const limit = 10;
//   const apiUrl = import.meta.env.VITE_API_URL;
//   const navigate = useNavigate();
//   const statuses = [
//     "All",
//     "Pending",
//     "In-Progress",
//     "Submitted",
//     "Completed",
//     "Delayed",
//   ];




//   const fetchTasks = async () => {
//     try {
//       const queryParams = new URLSearchParams({
//         search: searchText.trim(),
//         status: statusFilter,
//         page: page.toString(),
//         limit: limit.toString(),
//       }).toString();

//       const res = await fetch(`${apiUrl}/tasks?${queryParams}`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: token ? `Bearer ${token}` : "",
//         },
//         credentials: "include",
//       });
//       const data = await res.json();
//       console.log("Fetched tasks:", data);



//       //const token = localStorage.getItem("token");
//       // if (role === "Developer") {
//       //   const token = localStorage.getItem("token");
//       //   const decoded = token ? jwtDecode<TokenPayload>(token) : null;

//       //   if (decoded) {
//       //     console.log("Decoded Developer:", decoded);

//       //     data.tasks = data.tasks.filter((task: Task) => {
//       //       // 1️⃣ Check assignedTo field
//       //       const assignedMatches =
//       //         task.assignedTo === decoded.id || task.assignedTo === decoded.name;

//       //       // 2️⃣ Check developers object
//       //       const developersMatches = Object.values(task.developers || {}).some(
//       //         (devs) =>
//       //           devs.includes(decoded.id) || devs.includes(decoded.name || "")
//       //       );

//       //       return assignedMatches || developersMatches;
//       //     });

//       //     console.log("Filtered tasks for developer:", data.tasks);
//       //   }
//       // }



//       const decoded = token ? jwtDecode<TokenPayload>(token) : null;
//       console.log("Decoded user info:", decoded);



//       console.log("All fetched tasks:", data.tasks);

//       // if (role === "Developer" && decoded) {
//       //   data.tasks = data.tasks.filter((task: Task) => {
//       //     const assignedToMatches = task.assignedTo === decoded.id;
//       //     const developerInDomains = Object.values(task.developers || {}).some(
//       //       (devs) => devs.includes(decoded.id)
//       //     );
//       //     return assignedToMatches || developerInDomains;
//       //   });

//       //   console.log("Filtered tasks for developer:", data.tasks);
//       // }








//       setTasks(data.tasks || []);
//       setTotalPages(data.totalPages || 1);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchTasks();
//   }, [searchText, statusFilter, page]);

//   // Expand tasks by domain
//   const expandedRows = useMemo(() => {
//     const rows: any[] = [];
//     tasks.forEach((task) => {
//       const devDomains = Object.keys(task.developers || {});
//       let domains = devDomains.length
//         ? devDomains
//         : Array.isArray(task.domain) && task.domain.length
//           ? task.domain
//           : [];
//       if (!domains.length) {
//         rows.push({ task, domainName: null, developersForDomain: [] });
//       } else {
//         domains.forEach((d) => {
//           const devs =
//             task.developers && task.developers[d] ? task.developers[d] : [];
//           rows.push({ task, domainName: d, developersForDomain: devs });
//         });
//       }
//     });
//     return rows;
//   }, [tasks]);

//   const getStatusClass = (status: string) => {
//     switch (status.toLowerCase()) {
//       case "pending":
//         return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
//       case "in-progress":
//         return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400";
//       case "submitted":
//         return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
//       case "completed":
//         return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
//       case "delayed":
//         return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
//       default:
//         return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
//     }
//   };

//   const formatDate = (dateStr: string | number | Date) => {
//     if (!dateStr) return "-";
//     const d = new Date(dateStr);
//     return isNaN(d.getTime()) ? "-" : format(d, "yyyy-MM-dd");
//   };

//   return (
//     <>
//       <PageMeta title="Dashboard | TailAdmin" description="Task Dashboard" />
//       <PageBreadcrumb
//         items={[
//           { title: "Home", path: "/" },
//           { title: "Tasks", path: "/tasks" },
//         ]}
//       />
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
//         {cards.map((card, idx) => (
//           <div
//             key={idx}
//             className="bg-gray-800 rounded-lg p-4 text-center shadow hover:shadow-lg transition"
//           >
//             <h3 className="text-lg font-medium text-gray-200">{card.label}</h3>
//             <p className={card.style || "text-2xl font-bold text-gray-100"}>
//               {card.value}
//             </p>
//           </div>
//         ))}
//       </div>
//       {/* Search + Filter + Create */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

//         <div className="flex gap-2 flex-1">
//           <input
//             type="text"
//             placeholder="Search by project, code, or developer"
//             value={searchText}
//             onChange={(e) => setSearchText(e.target.value)}
//             className="flex-grow w-full md:w-80 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
//           />
//           <select
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="w-full md:w-48 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
//           >
//             {statuses.map((s) => (
//               <option key={s} value={s === "All" ? "" : s}>
//                 {s}
//               </option>
//             ))}
//           </select>
//         </div>
//         {role === "Admin" || role === "Sales" ? (
//           <button
//             onClick={() => navigate("/create")}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
//           >
//             + Create Task
//           </button>
//         ) : null}
//       </div>

//       {/* Table */}
//       <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] ">
//         <div className="w-full overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">

//           <table className=" text-left text-sm ">
//             <thead className="bg-gray-100 dark:bg-gray-800/50">
//               <tr>
//                 {[
//                   "Sr",
//                   "Project Code",
//                   "Project",
//                   "Assigned By",
//                   "Assigned To",
//                   "Assigned Date",
//                   "Completion Date",
//                   "Platform",
//                   "Developers",
//                   "Status",
//                   "Actions",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {expandedRows.map((row, idx) => {
//                 const srNo = (page - 1) * limit + idx + 1;
//                 const domainName = row.domainName;
//                 const developers = row.developersForDomain;
//                 return (
//                   <tr
//                     key={`${row.task.srNo}-${row.domainName ?? "none"}-${idx}`}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
//                   >
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {srNo}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {row.task.projectCode}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {row.task.title}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {row.task.assignedBy?.name || row.task.assignedBy || "-"}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {row.task.assignedTo?.name || row.task.assignedTo || "-"}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {formatDate(
//                         row.task.submissions?.[domainName]?.submittedAt ||
//                         row.task.taskAssignedDate
//                       )}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {formatDate(
//                         row.task.submissions?.[domainName]?.submittedAt ||
//                         row.task.completeDate
//                       )}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {domainName}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 text-white">
//                       {developers && developers.length ? developers.join(", ") : "-"}
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">
//                       <span
//                         className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(
//                           row.task.status
//                         )}`}
//                       >
//                         {row.task.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 ">
//                       <div className="flex gap-2 items-center">
//                         <button
//                           onClick={() =>
//                             navigate(
//                               `/tasks/${row.task._id}${domainName
//                                 ? `?domain=${encodeURIComponent(domainName)}`
//                                 : ""
//                               }`
//                             )
//                           }
//                           className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
//                         >
//                           View
//                         </button>


//                         {(role === "Admin" || role === "Sales" || role === "TL") && (
//                           <button
//                             onClick={() => navigate(`/edit/${row.task._id}`)}
//                             className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-400 text-gray-900 hover:bg-yellow-500"
//                           >
//                             Edit
//                           </button>
//                         )}
//                         {(role === "Admin" || role === "TL" || role === "Developer") && (
//                           <button
//                             onClick={() =>
//                               navigate(
//                                 `/submit/${row.task._id}${domainName ? `?domain=${encodeURIComponent(domainName)}` : ""
//                                 }`
//                               )
//                             }
//                             className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
//                           >
//                             Submit
//                           </button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>


//         <div className="flex justify-end gap-2 mt-4">
//           <div className="text-gray-400 ">
//             NO. of rows: {expandedRows.length}
//           </div>
//           <button
//             disabled={page <= 1}
//             onClick={() => setPage((p) => Math.max(1, p - 1))}
//             className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
//           >
//             Prev
//           </button>
//           <span className="px-3 py-1 text-white">
//             {page} / {totalPages}
//           </span>
//           <button
//             disabled={page >= totalPages}
//             onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//             className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TaskPage;

import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";

interface Stats {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
  inProgress: number;
}

interface Task {
  domain?: string[];
  srNo: number;
  projectCode: string;
  title: string;
  assignedBy: string;
  assignedTo: string;
  assignedDate: string;
  completionDate: string;
  platform: string;
  developers?: { [domain: string]: string[] };
  status: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  name?: string;
  exp?: number;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { role } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
  });

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const token = getCookie("token");

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/tasks/stats`, {
        method: "GET",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Tasks", value: stats.total, style: "text-2xl font-bold text-blue-400" },
    { label: "Pending Tasks", value: stats.pending, style: "text-2xl font-bold text-yellow-400" },
    { label: "In-Progress Tasks", value: stats.inProgress, style: "text-2xl font-bold text-purple-400" },
    { label: "Delayed Tasks", value: stats.delayed, style: "text-2xl font-bold text-red-400" },
    { label: "Completed Tasks", value: stats.completed, style: "text-2xl font-bold text-green-400" },
  ];

  if (token) {
    const decoded = jwtDecode<TokenPayload>(token);
    console.log("Decoded user info:", decoded);
  }

  const limit = 10;
  const statuses = ["All", "Pending", "In-Progress", "Submitted", "Completed", "Delayed"];

  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: searchText.trim(),
        status: statusFilter,
        page: page.toString(),
        limit: limit.toString(),
      }).toString();

      const res = await fetch(`${apiUrl}/tasks?${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        credentials: "include",
      });

      const data = await res.json();
      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [searchText, statusFilter, page]);

  const expandedRows = useMemo(() => {
    const rows: any[] = [];
    tasks.forEach((task) => {
      const devDomains = Object.keys(task.developers || {});
      let domains = devDomains.length
        ? devDomains
        : Array.isArray(task.domain) && task.domain.length
        ? task.domain
        : [];
      if (!domains.length) {
        rows.push({ task, domainName: null, developersForDomain: [] });
      } else {
        domains.forEach((d) => {
          const devs =
            task.developers && task.developers[d] ? task.developers[d] : [];
          rows.push({ task, domainName: d, developersForDomain: devs });
        });
      }
    });
    return rows;
  }, [tasks]);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-purple-100 text-purple-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "delayed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string | number | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : format(d, "yyyy-MM-dd");
  };

  return (
    <>
      <PageMeta title="Dashboard | TailAdmin" description="Task Dashboard" />
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-gray-100 rounded-lg p-4 text-center shadow hover:shadow-lg transition"
          >
            <h3 className="text-lg font-medium text-gray-800">{card.label}</h3>
            <p className={card.style || "text-2xl font-bold text-gray-900"}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by project, code, or developer"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-grow w-full md:w-80 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-48 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          >
            {statuses.map((s) => (
              <option key={s} value={s === "All" ? "" : s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(role === "Admin" || role === "Sales") && (
          <button
            onClick={() => navigate("/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            + Create Task
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-5">
        <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-white">
          <table className="text-left text-sm w-full">
            <thead className="bg-gray-200">
              <tr>
                {[
                  "Sr",
                  "Project Code",
                  "Project",
                  "Assigned By",
                  "Assigned To",
                  "Assigned Date",
                  "Completion Date",
                  "Platform",
                  "Developers",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-gray-800 font-medium border-b border-gray-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expandedRows.map((row, idx) => {
                const srNo = (page - 1) * limit + idx + 1;
                const domainName = row.domainName;
                const developers = row.developersForDomain;
                return (
                  <tr
                    key={`${row.task.srNo}-${row.domainName ?? "none"}-${idx}`}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{srNo}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{row.task.projectCode}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{row.task.title}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{row.task.assignedBy?.name || row.task.assignedBy || "-"}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{row.task.assignedTo?.name || row.task.assignedTo || "-"}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{formatDate(row.task.submissions?.[domainName]?.submittedAt || row.task.taskAssignedDate)}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{formatDate(row.task.submissions?.[domainName]?.submittedAt || row.task.completeDate)}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{domainName}</td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">{developers && developers.length ? developers.join(", ") : "-"}</td>
                    <td className="px-4 py-3 border-b border-gray-300 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(row.task.status)}`}>
                        {row.task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => navigate(`/tasks/${row.task._id}${domainName ? `?domain=${encodeURIComponent(domainName)}` : ""}`)}
                          className="px-3 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          View
                        </button>
                        {(role === "Admin" || role === "Sales" || role === "TL") && (
                          <button
                            onClick={() => navigate(`/edit/${row.task._id}`)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-yellow-400 text-gray-900 hover:bg-yellow-500"
                          >
                            Edit
                          </button>
                        )}
                        {(role === "Admin" || role === "TL" || role === "Developer") && (
                          <button
                            onClick={() => navigate(`/submit/${row.task._id}${domainName ? `?domain=${encodeURIComponent(domainName)}` : ""}`)}
                            className="px-3 py-1 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <div className="text-gray-600">NO. of rows: {expandedRows.length}</div>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-gray-800">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default TaskPage;

