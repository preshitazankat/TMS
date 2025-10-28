import React, { useState, useEffect, useMemo } from "react";
import PageMeta from "../common/PageMeta";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { useNavigate } from "react-router";
import { format } from "date-fns";
import { useAuth } from "../../hooks/useAuth";
import { jwtDecode } from "jwt-decode";
import { FiEye, FiEdit2, FiSend } from "react-icons/fi";
import { GrCompliance } from "react-icons/gr"; // View, Edit, Submit
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiClipboard, FiClock, FiCheckCircle, FiAlertCircle, FiPlay, FiBox } from "react-icons/fi";


interface Stats {
  total: number;
  completed: number;
  pending: number;
  delayed: number;
  inProgress: number;
  inRD: number;
}

interface Domain {
  _id: string | { $oid: string };
  name: string;
  status: string;
}

interface Task {
  _id: any;
  domains?: Domain[];
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

interface DeveloperTask {
  name: string;
  assigned: number;
  completed: number;
  inProgress: number;
  inRD: number;
}

interface DomainStats {
  total: number;
  pending: number;
  "in-progress": number;
  delayed: number;
  "in-R&D": number;
  submitted: number;
}

const TaskPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { role } = useAuth();
  const [domainStats, setDomainStats] = useState<Record<string, DomainStats>>(
    {}
  );
  const [currentDomain, setCurrentDomain] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [showAssignDevPopup, setShowAssignDevPopup] = useState(false);

  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    pending: 0,
    delayed: 0,
    inProgress: 0,
    inRD: 0,
  });
  const [developers, setDevelopers] = useState<DeveloperTask[]>([]);
  const [userRole, setUserRole] = useState<string>("");

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [newStatus, setNewStatus] = useState("in-R&D");
  const [statusReason, setStatusReason] = useState("");

  const normalizedFilter = statusFilter
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/&/g, "and");
  const [loading, setLoading] = useState(true);

  // --- openStatusModal (update so domain includes id + status) ---
  const openStatusModal = (
    task: Task,
    domain?: { id: string; name: string; status?: string }
  ) => {
    setCurrentTask(task);
    if (domain) {
      setCurrentDomain(domain);
    } else {
      setCurrentDomain(null);
    }
    // prefer domain.status if provided, else fallback to task.status
    setNewStatus("in-R&D");
    setStatusReason("");
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setCurrentTask(null);
  };

  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

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

  const token = getCookie("token");
  if (!token) return navigate("/login");

  useEffect(() => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
      fetchStats(token);

      // if (payload.role === "Manager") fetchDevelopers(token);
    } catch (err) {
      console.error("Invalid token", err);
      navigate("/login");
    }
  }, []);

  const cards = [
    { label: "Total Tasks", value: stats.total, icon: <FiClipboard />, bgColor: "bg-blue-50", textColor: "text-gray-500" },
    { label: "Pending Tasks", value: stats.pending, icon: <FiClock />, bgColor: "bg-yellow-50", textColor: "text-gray-500" },
    { label: "In-Progress Tasks", value: stats.inProgress, icon: <FiPlay />, bgColor: "bg-purple-50", textColor: "text-gray-500" },
    { label: "Delayed Tasks", value: stats.delayed, icon: <FiAlertCircle />, bgColor: "bg-red-50", textColor: "text-gray-500" },
    { label: "Completed Tasks", value: stats.completed, icon: <FiCheckCircle />, bgColor: "bg-green-50", textColor: "text-gray-500" },
    { label: "In-R&D", value: stats.inRD, icon: <FiBox />, bgColor: "bg-orange-50", textColor: "text-gray-500" },
  ];

  if (token) {
    const decoded = jwtDecode<TokenPayload>(token);
    console.log("Decoded user info:", decoded);
  }

  const limit = 10;

  const statuses = [
    "All",
    "Pending",
    "In-Progress",
    "Submitted",
    "Delayed",
    "In-R&D",
  ];



  const fetchTasks = async () => {
    setLoading(true);
    try {
      const statusParam =
        statusFilter && statusFilter !== "All" ? statusFilter : "";

      const queryParams = new URLSearchParams({
        search: searchText,
        status: statusParam,
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
//       setTasks(prev =>
//   prev.map(t =>
//     t._id === updatedTask._id ? { ...t, ...updatedTask } : t
//   )
// );

      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchTasks();


  }, [searchText, statusFilter, page]);

  const expandedRows = useMemo(() => {
    const rows: any[] = [];

    tasks.forEach((task) => {
      if (task.domainName) {
        const domainObj =
          task.domain?.find((d) => d.name === task.domainName) ||
          task.domain?.[0];
        rows.push({
          task,
          domainName: task.domainName,
          domainId: domainObj
            ? typeof domainObj._id === "object"
              ? domainObj._id.$oid
              : domainObj._id
            : "",
          domainStatus: task.domainStatus,
          developers: task.domainDevelopers || [],
        });
      } else {
        rows.push({
          task,
          domainName: null,
          domainStatus: task.domainStatus || task.status || "Pending",
          developers: [],
        });
      }
    });
    return rows;
  }, [tasks]);

  const paginatedRows = expandedRows; // backend already paginated
  const totalPagesComputed = totalPages; // from backend response

  const getStatusClass = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-800"; // fallback for undefined
    switch (status) {
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
      case "in-r&d":
      case "in-rd":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-orange-100 text-orange-800";
    }
  };

  const formatDate = (dateStr: string | number | Date) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "-" : format(d, "yyyy-MM-dd");
  };

  const formatStatus = (status?: string) => {
    if (!status) return "-";
    return status
      .split(/[-\s]/) // split by hyphen or space
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("-"); // join with hyphen
  };

  // --- Updated handleStatusUpdate (use currentDomain/currentTask internally) ---
  const handleStatusUpdate = async () => {
    if (!currentTask || !currentDomain) return;

    // const taskId = typeof currentTask._id === "object" ? currentTask._id.$oid : currentTask._id;
    // const domainId = currentDomain?.id ?? "";

    // console.log("domainID", domainId);

    // if (!taskId || !currentDomain.id || !newStatus) {
    //   alert("taskId, domainId, and status are required");
    //   return;
    // }

    const formData = new FormData();
    formData.append("taskId", currentTask._id);
    formData.append("domainName", currentTask.domainName);
    formData.append("status", newStatus);
    formData.append("reason", statusReason);

    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${apiUrl}/tasks/domain-status`, {
        method: "PUT",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Update failed");

      await fetchTasks();
      closeStatusModal();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid"></div>
      </div>
    );
  }




  return (
    <>
      <PageMeta title="Dashboard | TailAdmin" description="Task Dashboard" />
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-5 text-black">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`${card.bgColor} rounded-lg p-4 text-center shadow hover:shadow-lg `}

          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{card.icon}</span>
              <h3 className="text-lg font-medium">{card.label}</h3>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by project, code, or developer"
            value={searchText}
            onChange={(e) => {

              setSearchText(e.target.value);

              setPage(1);
            }}
            autoFocus={true}
            className="flex-grow w-full md:w-80 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          />


          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="w-full md:w-48 p-2 rounded-lg border border-gray-300 bg-white text-gray-800"
          >
            {statuses.map((s) => (
              <option key={s} value={s === "All" ? "" : s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {(role === "Admin" || role === "Sales" || role === "Manager") && (
          <button
            onClick={() => navigate("/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
          >
            + Create Task
          </button>
        )}
      </div>

      <div className="rounded-lg border border-gray-300 bg-white p-5">
        <div className="w-full overflow-x-auto border border-gray-300 rounded-lg bg-gray-100">
          <table className="text-left text-sm w-full">
            <thead className="bg-gray-200">
              <tr>
                {[
                  "No.",
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
              {paginatedRows.map((row, idx) => {
                const srNo = (page - 1) * limit + idx + 1;

                const developers = row.developers || [];
                const domainObj =
                  row.task?.domains?.find((d) => d.name === row.domainName) ||
                  row.task?.domains?.[0];

                const domainId = domainObj
                  ? typeof domainObj._id === "object"
                    ? domainObj._id.$oid
                    : domainObj._id
                  : ""; // fallback if domainObj is undefined
                console.log("domainID", domainId);

                return (
                  <tr
                    //key={`${row.task.srNo}-${row.domainName ?? "none"}-${idx}`}
                    key={`${row.task._id}-${row.domainName ?? "none"}`}

                    className="hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {srNo}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {row.task.projectCode}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {row.task.title}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {row.task.assignedBy?.name || row.task.assignedBy || "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {row.task.assignedTo?.name || row.task.assignedTo || "-"}
                    </td>
                    {/* Assigned Date → task.createdAt */}
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {formatDate(row.task.taskAssignedDate)}
                    </td>

                    {/* Completion Date → domain completeDate */}
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {formatDate(row.task.completeDate)}
                    </td>

                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {row.domainName || "-"}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300 text-gray-800">
                      {developers.length ? developers.join(", ") : "-"}
                    </td>
                    <td
                      className="px-4 py-3 border-b border-gray-300 whitespace-nowrap cursor-pointer"
                      onClick={() => {
                        if (
                          role === "TL" ||
                          role === "Manager" ||
                          role === "Admin"
                        ) {
                          const domainObj =
                            row.task?.domains?.find(
                              (d) => d.name === row.domainName
                            ) || row.task?.domains?.[0];

                          const domainId =
                            typeof domainObj?._id === "object"
                              ? domainObj._id.$oid ?? ""
                              : domainObj?._id ?? "";

                          openStatusModal(row.task, {
                            id: domainId,
                            name: domainObj?.name || "Unknown",
                            status:
                              domainObj?.status ||
                              row.domainStatus ||
                              "Pending",
                          });
                        }
                      }}
                    >
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClass(
                          row.domainStatus
                        )}`}
                        title={
                          role === "TL" || role === "Manager"
                            ? "Click to change status"
                            : ""
                        }
                      >
                        {formatStatus(row.domainStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-gray-300">
                      <div className="flex gap-4 items-center">
                        <FiEye
                          onClick={() =>
                            navigate(
                              `/tasks/${row.task._id}${row.domainName
                                ? `?domain=${encodeURIComponent(
                                  row.domainName
                                )}`
                                : ""
                              }`
                            )
                          }
                          className="cursor-pointer text-blue-600 hover:text-blue-800"
                          title="View"
                          size={20}
                        />
                        {(role === "Admin" ||
                          role === "Sales" ||
                          role === "TL" ||
                          role === "Manager") && (
                            <FiEdit2
                              onClick={() => navigate(`/edit/${row.task._id}`)}
                              className="cursor-pointer text-yellow-500 hover:text-yellow-600"
                              title="Edit"
                              size={20}
                            />
                          )}
                        {/* ✅ Show Submit button only if not submitted and developer is assigned */}
                        {(role === "Admin" ||
                          role === "TL" ||
                          role === "Developer" ||
                          role === "Manager") &&
                          row.domainStatus?.toLowerCase() !== "submitted" &&
                          (row.developers?.length > 0 ? (
                            <GrCompliance
                              onClick={() =>
                                navigate(
                                  `/submit/${row.task._id}${row.domainName
                                    ? `?domain=${encodeURIComponent(row.domainName)}`
                                    : ""
                                  }`
                                )
                              }
                              className="cursor-pointer text-green-600 hover:text-green-700"
                              title="Submit"
                              size={20}
                            />
                          ) : (
                            // Show popup instead of disabled icon
                            <GrCompliance
                              onClick={() => setShowAssignDevPopup(true)}
                              className="cursor-pointer text-gray-400"
                              title="Assign a developer first"
                              size={20}
                            />
                          ))}

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-4 items-center">
          <div className="text-gray-600">
            No. Of Rows: {paginatedRows.length}
          </div>
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {statusModalOpen && currentTask && currentDomain && currentDomain.status.toLowerCase() !== 'submitted' && (
        <div className="fixed inset-0 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Update Status</h2>

            <div className="mb-4">
              <label className="block mb-1 font-medium">New Status</label>

              {/* The status is already set to 'in-R&D' in openStatusModal */}
              <h3 className="w-full p-2 border rounded bg-gray-100 text-gray-800 font-semibold">
                in-R&D
              </h3>

            </div>

            <div className="mb-4">
              <label className="block mb-1 font-medium">Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter reason for status change"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Upload File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border rounded p-1 w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Update
              </button>
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 rounded bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignDevPopup && (
        <div className="fixed inset-0  bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Cannot Submit</h2>
            <p className="mb-4">Please assign at least one developer before submitting this task.</p>
            <button
              onClick={() => setShowAssignDevPopup(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

    </>
  );
};



export default TaskPage;
