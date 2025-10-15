import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FileText, Users, Calendar, Folder, ArrowLeft,Info } from "lucide-react";

const TaskDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainParam = searchParams.get("domain");
  const [task, setTask] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const res = await fetch(`${apiUrl}/tasks/${id}`);
        const data = await res.json();
        setTask(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTask();
  }, [id, apiUrl]);

  const buildFileUrl = (fileUrl) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    const base = apiUrl.replace(/\/api$/, "");
    return `${base}/${fileUrl}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!task) return <div className="p-6 text-gray-100">Loading task details...</div>;

  let submission = null;
  let displayedDomain = domainParam;

  if (domainParam && task.submissions) {
    submission = task.submissions?.[domainParam] || null;
  }
  if (!submission && !domainParam && task.submissions) {
    const entries = Object.entries(task.submissions || {});
    if (entries.length === 1) {
      submission = entries[0][1];
      displayedDomain = entries[0][0];
    }
  }

  const getDomainName = (url) => {
    try {
      // Add scheme if missing
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      const hostname = new URL(normalized).hostname;
      // remove "www."
      return hostname.replace(/^www\./, "");
    } catch {
      return url; // fallback
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8 text-gray-100">
        {/* HEADER */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{task.projectCode}</h1>
            <span className="text-3xl font-bold">-</span>
            <h1 className="text-3xl font-bold">{task.title}</h1>
          </div>
          {task.description && <p className="text-gray-400">{task.description}</p>}
          <div className="flex gap-3 flex-wrap">
            {/* <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${task.priority === "High"
                ? "bg-red-500/20 text-red-400"
                : task.priority === "Medium"
                  ? "bg-orange-500/20 text-orange-400"
                  : task.priority === "Very High"
                    ? "bg-red-800/20 text-red-400"
                    : "bg-green-500/20 text-green-400"
                }`}
            >
              {task.priority}
            </span> */}
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">
              {task.status}
            </span>
            {displayedDomain && (
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-sm font-semibold">
                {getDomainName(displayedDomain)}
              </span>
            )}

          </div>
        </div>

        {/* SUBMISSION */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-blue-400" />
            <h2 className="text-xl font-semibold">Submission</h2>
          </div>
          {submission ? (
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
              {submission.files && submission.files.length > 0 && (
                <div className="md:col-span-2">
                  <p className="text-gray-400 text-sm mb-1">Submission Files</p>
                  <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                    {submission.files ? (
                      <li>
                        <a
                          href={submission.files.startsWith("http") ? submission.files : buildFileUrl(submission.files)}
                          className="text-blue-400 underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View File
                        </a>
                      </li>
                    ) : (
                      <li className="text-gray-400">No file uploaded</li>
                    )}
                  </ul>
                </div>
              )}
              <Detail
                label="Platform"
                value={displayedDomain}
              />
              <Detail label="Country" value={submission.country} />
              {/* <Detail label="Feasible For" value={submission.feasibleFor} /> */}
              <Detail label="Approx Volume" value={submission.approxVolume} />
              <Detail label="Method" value={submission.method} />
              <Detail label="User Login" value={submission.userLogin ? "Yes" : "No"} />
              <Detail label="Proxy Used" value={submission.proxyUsed ? "Yes" : "No"} />

              {submission.proxyUsed && (
                <>
                  <Detail label="Proxy Name" value={submission.proxyName} />
                  <Detail label="Per Request Credit" value={submission.perRequestCredit} />
                  <Detail label="Total Requests" value={submission.totalRequest} />
                </>
              )}

              {submission.userLogin && (
                <>
                  <Detail label="Login Type" value={submission.loginType || "-"} />
                  <Detail label="Credentials" value={submission.credentials || "-"} />
                </>
              )}

              {/* <Detail
                label="Last Checked Date"
                value={
                  submission.lastCheckedDate
                    ? new Date(submission.lastCheckedDate).toLocaleDateString()
                    : "-"
                }
              /> */}
              <Detail label="Complexity" value={submission.complexity} />

              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm">GitHub Link</p>
                {submission.githubLink ? (
                  <a href={submission.githubLink} className="text-blue-400 underline">
                    View Repo
                  </a>
                ) : (
                  <p className="text-gray-500">-</p>
                )}
              </div>
                    <div className="md:col-span-2">
                <p className="text-gray-400 text-sm">Remark</p>
                {submission.remarks ? (
             <span className="text-gray-200 whitespace-pre-wrap">{submission.remarks}</span>
                ) : (
                  <p className="text-gray-500">-</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No submission found for this domain.</p>
          )}
        </div>

        {/* Details */}
         <Section title="Details" icon={<Info size={18} className="text-green-400" />}>
          <div className="grid md:grid-cols-3 gap-6">
            {/* <Detail label="SempleFile" value={task.sempleFile} /> */}
            <Detail label="TypeOfDelivery" value={task.typeOfDelivery} />
            <Detail label="TypeOfPlatform" value={task.typeOfPlatform} />
          </div>
        </Section>

        {/* TIMELINE */}
        <Section title="Task Timeline" icon={<Calendar size={18} className="text-green-400" />}>
          <div className="grid md:grid-cols-3 gap-6">
            <Detail label="Assigned" value={formatDateTime(task.taskAssignedDate)} />
            <Detail label="Target" value={formatDateTime(task.targetDate)} />
            <Detail label="Completed" value={formatDateTime(
              task.status === "completed" || task.status === "submitted" ? task.completeDate : submission?.submittedAt
            )} />
          </div>
        </Section>

        {/* PEOPLE */}
        <Section title="People" icon={<Users size={18} className="text-pink-400" />}>
          <div className="grid md:grid-cols-2 gap-6">
            <Detail label="Assigned By" value={task.assignedBy} />
            <Detail label="Assigned To" value={task.assignedTo} />
          </div>
          <div className="mt-4">
  <p className="text-gray-400 text-sm">Developer(s)</p>
   <p className="text-gray-200">
    {displayedDomain && task.developers?.[displayedDomain]?.length
      ? task.developers[displayedDomain].join(" • ")
      : "-"}
  </p>
</div>

        </Section>

        {/* FILES */}
        <Section title="Attachment" icon={<Folder size={18} className="text-yellow-400" />}>
          <div className="grid md:grid-cols-2 gap-6">
            <FileBlock label="SOW Document" file={task.sowFile} url={task.sowUrl} buildFileUrl={buildFileUrl} />
            <FileBlock label="Input Document" file={task.inputFile} url={task.inputUrl} buildFileUrl={buildFileUrl} />
          </div>
        </Section>

        {/* BACK */}
        <div className="flex gap-4 pt-4 border-t border-gray-700">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }) => (
  <div className="bg-gray-800 rounded-xl shadow-lg p-6">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);

const Detail = ({ label, value }) => (
  <div>
    <p className="text-gray-400 text-sm">{label}</p>
    <p className="text-gray-200 font-medium">{value || "-"}</p>
  </div>
);

const FileBlock = ({ label, file, url, buildFileUrl }) => (
  <div>
    <p className="text-gray-400 text-sm">{label}</p>
    {file && (
      <a href={buildFileUrl(file)} className="text-blue-400 underline block" target="_blank" rel="noreferrer">
        View File
      </a>
    )}
    {url && (
      <a href={url} className="text-blue-400 underline block" target="_blank" rel="noreferrer">
        View File
      </a>
    )}
    {!file && !url && <p className="text-gray-500">-</p>}
  </div>
);

export default TaskDetail;
