// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { format, addDays } from "date-fns";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, delayed: 0, inProgress: 0, });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  // const [priorityFilter, setPriorityFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10; // show 10 expanded rows per page

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const fetchTasks = async () => {
    try {
      const queryParams = new URLSearchParams({
        search: searchText,
        //status: statusFilter,
        //priority: priorityFilter,
        page: 1, // we fetch a page of tasks from server — client will expand rows and paginate them
        limit: 100, // request higher chunk so we can expand domains client-side (tweak if too large)
      }).toString();

      const res = await fetch(`${apiUrl}/tasks?${queryParams}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiUrl}/tasks/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
    
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [searchText, statusFilter, /*priorityFilter*/]);

  function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // build expandedRows = array of { task, domainName (or null), developerList }
  const expandedRows = useMemo(() => {
    const rows = [];
    tasks.forEach((task) => {
      // prefer developers keys, otherwise fall back to task.domain
      const devDomains = Object.keys(task.developers || {});
      let domains = devDomains.length ? devDomains : (Array.isArray(task.domain) && task.domain.length ? task.domain : []);
      if (domains.length === 0) {
        // still include one row for the task (no domain)
        rows.push({ task, domainName: null, developersForDomain: [] });
      } else {
        domains.forEach((d) => {
          const devs = (task.developers && task.developers[d]) ? task.developers[d] : [];
          rows.push({ task, domainName: d, developersForDomain: devs });
        });
      }
    });
    return rows;
  }, [tasks]);

  const filteredRows = useMemo(() => {
    return expandedRows.filter((row) => {
      const rowStatus =
        row.task.submissions?.[row.domainName]?.status || row.task.status;
      // if no filter selected → include all rows
      return !statusFilter || rowStatus.toLowerCase() === statusFilter.toLowerCase();
    });
  }, [expandedRows, statusFilter]);

  const totalRows = expandedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / limit));
  const paginatedRows = filteredRows.slice((page - 1) * limit, page * limit);

  // map status → Tailwind classes
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-600 text-yellow-100";
      case "in-progress":
        return "bg-purple-600 text-purple-100";
      case "submitted":
        return "bg-blue-600 text-blue-100";
      case "completed":
        return "bg-green-600 text-green-100";
      case "delayed":
        return "bg-red-600 text-red-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  // map priority → Tailwind classes
  // const getPriorityClass = (priority) => {
  //   switch (priority?.toLowerCase()) {
  //     case "high":
  //       return "bg-red-600 text-red-100";
  //     case "medium":
  //       return "bg-yellow-600 text-yellow-100";
  //     case "low":
  //       return "bg-green-600 text-green-100";

      
  //     default:
  //       return "bg-gray-600 text-gray-100";
  //   }
  // };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d) ? "-" : format(d, "yyyy-MM-dd");
  };


  return (
    <div className="min-h-screen w-full bg-gray-900 p-6 text-gray-100">
      <div className="w-full max-w-8xl mx-auto px-6">
        {/* stats & filters (same as before) */}
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Tasks", value: stats.total, style: "text-2xl font-bold text-blue-400" },
            { label: "Pending Tasks", value: stats.pending, style: "text-2xl font-bold text-yellow-400" },
            { label: "In-Progress Tasks", value: stats.inProgress, style: "text-2xl font-bold text-purple-400" },
            { label: "Delayed Tasks", value: stats.delayed, style: "text-2xl font-bold text-red-400" },
            { label: "Completed Tasks", value: stats.completed, style: "text-2xl font-bold text-green-400" },
          ].map((card, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg p-4 text-center shadow hover:shadow-lg transition"
            >
              <h3 className="text-lg font-medium text-gray-200">{card.label}</h3>
              {/* 👇 dynamic style here */}
              <p className={card.style || "text-2xl font-bold text-gray-100"}>
                {card.value}
              </p>
            </div>
          ))}
        </div>


        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by Project, Project code, Domain, Developers, Assigned By  or Assigned To..."
            value={searchText}
            onChange={(e) => { setPage(1); setSearchText(e.target.value); }}
            className="flex-1 p-2 rounded-md border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="p-2 rounded-md border border-gray-700 bg-gray-800 text-gray-100">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In-progress</option>
            <option value="submitted">Submitted</option>
          </select>

          {/* <select value={priorityFilter} onChange={(e) => { setPage(1); setPriorityFilter(e.target.value); }} className="p-2 rounded-md border border-gray-700 bg-gray-800 text-gray-100">
            <option value="">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            
          </select> */}

          <button onClick={() => navigate("/create")} className="bg-green-600 px-4 py-2 rounded-md hover:bg-green-700 text-white">Create Task</button>
        </div>

        <div className="w-full overflow-x-auto rounded-lg border border-gray-700">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-gray-800">
              <tr>
                {[
                  "SrNo",
                  "Project Code",
                  "Project",
                  "Assigned By",
                  "Assigned To",
                  "Assigned Date",
                  "Completion Date",
                  "Platform",
                  "Developers",
                  // "Priority",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 border-b border-gray-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4 text-gray-400">
                    No tasks found 🚫
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, idx) => {
                  const srNo = (page - 1) * limit + idx + 1; // 1..10
                  const { task, domainName, developersForDomain, } = row;
                  const domainDisplay = domainName || "-";
                  return (
                    <tr
                      key={task._id + "-" + (domainName || "no-domain") + "-" + idx}
                      className="hover:bg-gray-800"
                    >
                      <td className="px-3 py-2 border-b border-gray-700">{srNo}</td>
                      <td className="px-3 py-2 border-b border-gray-700">{task.projectCode || "-"}</td>
                      <td className="px-3 py-2 border-b border-gray-700">{task.title}</td>
                      <td className="px-3 py-2 border-b border-gray-700">{task.assignedBy}</td>
                      <td className="px-3 py-2 border-b border-gray-700">{task.assignedTo}</td>
                      <td className="px-3 py-2 border-b border-gray-700">
                        {formatDate(task.taskAssignedDate)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-700">
                        {formatDate(task.submissions?.[domainName]?.submittedAt|| task.completeDate)}
                      </td>
                      <td className="px-3 py-2 border-b border-gray-700">{domainDisplay}</td>
                      <td className="px-3 py-2 border-b border-gray-700">
                        {developersForDomain && developersForDomain.length
                          ? developersForDomain.join(", ")
                          : "-"}
                      </td>
                      {/* Priority */}
                      {/* <td className="px-3 py-2 border-b border-gray-700">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityClass(task.priority)}`}
                        >
                          {capitalizeFirstLetter(task.priority)}
                        </span>
                      </td> */}
                      

                      {/* Status */}
                      <td className="px-3 py-2 border-b border-gray-700">
                        {(() => {
                          const status = task.submissions?.[domainName]?.status || task.status;
                          return (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(status)}`}
                            >
                              {capitalizeFirstLetter(status)}
                            </span>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-700 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            navigate(
                              `/tasks/${task._id}${domainName ? `?domain=${encodeURIComponent(domainName)}` : ""
                              }`
                            )
                          }
                          className="bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 text-white"
                        >
                          View
                        </button>
                        <button
                          onClick={() => navigate(`/edit/${task._id}`)}
                          className="bg-yellow-500 px-2 py-1 rounded hover:bg-yellow-600 text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/submit/${task._id}${domainName ? `?domain=${encodeURIComponent(domainName)}` : ""
                              }`
                            )
                          }
                          className="bg-indigo-500 px-2 py-1 rounded hover:bg-indigo-600 text-white"
                        >
                          Submit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex justify-end items-center gap-4 mt-4">
          <div className="text-gray-400 ">
          NO. of rows: {totalRows}
  </div>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition">Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 transition">Next</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
