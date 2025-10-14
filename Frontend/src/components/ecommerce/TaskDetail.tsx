

import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import { FileText, Users, Calendar, Folder, ArrowLeft } from "lucide-react";
import PageBreadcrumb from "../common/PageBreadCrumb";

interface Submission {
  files?: string[];
  country?: string[];
  approxVolume?: string;
  method?: string;
  userLogin?: boolean;
  loginType?: string;
  credentials?: string;
  proxyUsed?: boolean;
  proxyName?: string;
  perRequestCredit?: number;
  totalRequest?: number;
  complexity?: string;
  githubLink?: string;
  remarks?: string;
  submittedAt?: string;
}

interface Task {
  id: string;
  projectCode: string;
  title: string;
  description?: string;
  status?: string;
  typeOfDelivery?: string;
  typeOfPlatform?: string;
  taskAssignedDate?: string;
  targetDate?: string;
  completeDate?: string;
  assignedBy?: string;
  assignedTo?: string;
  developers?: Record<string, string[]>;
  sowFile?: string;
  sowUrl?: string;
  inputFile?: string;
  inputUrl?: string;
  submissions?: Record<string, Submission>;
  reason?:string;
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainParam = searchParams.get("domain");
  const [task, setTask] = useState<Task | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL as string;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/tasks/${id}`, { 
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        const data: Task = await res.json();
        setTask(data);
      } catch (err) {
        console.error(err);
      }finally {
      setLoading(false); // stop loader
    }
    };
    fetchTask();
  }, [id, apiUrl]);

  const buildFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    const base = apiUrl.replace(/\/api$/, "");
    return `${base}/${fileUrl}`;
  };

  const formatDateTime = (dateStr?: string | number | Date) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!task) return <div className="p-6 text-gray-800">Loading task details...</div>;

  let domainObj: any = null;
let showDomainDetails = false;
let displayedDomain: string | null = domainParam;
let submission: Submission | null = null;

if (task.domains && task.domains.length > 0) {
  // 1️⃣ If URL param ?domain=something is present
  if (domainParam) {
    domainObj = task.domains.find((d) => d.name === domainParam);
  }
  // 2️⃣ If not specified, pick the first domain (for single-domain tasks)
  if (!domainObj && task.domains.length === 1) {
    domainObj = task.domains[0];
    displayedDomain = domainObj.name;
  }

  // 3️⃣ Extract submission data
  if (domainObj && domainObj.submission) {
    submission = domainObj.submission;
  }

  // ✅ Determine if remarks/file should be shown
  showDomainDetails =
    domainObj && domainObj.status && domainObj.status.toLowerCase() === "in-r&d";
}


  const getDomainName = (url: string) => {
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      const hostname = new URL(normalized).hostname;
      return hostname.replace(/^www\./, "");
    } catch {
      return url;
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
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
          { title: task.projectCode },
        ]}
      />
      <div className="min-h-screen  py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-8 text-gray-900">
          {/* HEADER */}
          <div className="bg-gray-100 rounded-xl shadow-lg p-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{task.projectCode}</h1>
              <span className="text-3xl font-bold">-</span>
              <h1 className="text-3xl font-bold">{task.title}</h1>
            </div>
            {task.description && <p className="text-gray-700">{task.description}</p>}
           {/* Show only selected domain */}
<div className="flex gap-2">
  {displayedDomain ? (
    <>
      <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 text-sm font-semibold">
        {displayedDomain}
      </span>
      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
        {task.domains?.find((d) => d.name === displayedDomain)?.status || task.status || "No status"}
      </span>
    </>
  ) : (
    <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">
      {task.status || "No status"}
    </span>
  )}
</div>
{showDomainDetails && (
  <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
    {domainObj.remarks && (
      <p className="text-gray-900 text-sm mb-2">
        <span className="font-semibold ">Reason:</span> {domainObj.remarks}
      </p>
    )}
    {domainObj.upload && domainObj.upload.filename && (
      
      <a
        href={buildFileUrl(domainObj.upload.path)}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600  text-sm"
      >
        <span className="font-semibold text-black">View Uploaded File:</span> {domainObj.upload.originalname}
      </a>
    )}
  </div>
)}


          </div>

          {/* SUBMISSION */}
          <Section title="Submission" icon={<FileText size={18} className="text-blue-600 bg-gray-100" />}>
            {submission ? (
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 bg-gray-100">
                <div className="mb-4">
                  <label className="block text-[14px] text-gray-800 mb-1">Sample Output Data</label>
                  {submission.files && submission.files.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                      {(Array.isArray(submission.files) ? submission.files : [submission.files]).map((file, idx) => (
                        <li key={idx}>
                          <a
                            href={file.startsWith("http") ? file : buildFileUrl(file)}
                            className="text-blue-600 underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            View File
                          </a>
                          <Detail
                            label="Date"
                            value={formatDateTime(
                              task.status === "completed" || task.status === "submitted"
                                ? task.completeDate
                                : submission?.submittedAt
                            )}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No file uploaded</p>
                  )}
                </div>

                <Detail label="Platform" value={displayedDomain || "-"} />
                <Detail
                  label="Country"
                  value={Array.isArray(submission.country)
                    ? submission.country.join(" • ")
                    : submission.country || "-"}
                />
                <Detail label="Approx Volume" value={submission.approxVolume || "-"} />
                <Detail label="Method" value={submission.method || "-"} />
                <Detail label="User Login" value={submission.userLogin ? "Yes" : "No"} />
                <Detail label="Proxy Used" value={submission.proxyUsed ? "Yes" : "No"} />

                {submission.proxyUsed && (
                  <>
                    <Detail label="Proxy Name" value={submission.proxyName || "-"} />
                    <Detail label="Per Request Credit" value={submission.perRequestCredit?.toString() || "-"} />
                    <Detail label="Total Requests" value={submission.totalRequest?.toString() || "-"} />
                  </>
                )}

                {submission.userLogin && (
                  <>
                    <Detail label="Login Type" value={submission.loginType || "-"} />
                    <Detail label="Credentials" value={submission.credentials || "-"} />
                  </>
                )}

                <Detail label="Complexity" value={submission.complexity || "-"} />
                <Detail label="Type Of Delivery" value={task.typeOfDelivery || "-"} />
                <Detail label="Type Of Platform" value={task.typeOfPlatform || "-"} />

                <div className="md:col-span-2">
                  <p className="text-gray-700 text-sm">GitHub Link</p>
                  {submission.githubLink ? (
                    <a href={submission.githubLink} className="text-blue-600 underline">
                      View Repo
                    </a>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-700 text-sm">Remark</p>
                  {submission.remarks ? (
                    <span className="text-gray-900 whitespace-pre-wrap">{submission.remarks}</span>
                  ) : (
                    <p className="text-gray-500">-</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No submission found for this domain.</p>
            )}
          </Section>

          {/* TIMELINE */}
          <Section title="Task Timeline" icon={<Calendar size={18} className="text-green-600 bg-gray-100" />}>
            <div className="grid md:grid-cols-3 gap-6 ">
              <Detail label="Assigned" value={formatDateTime(task.taskAssignedDate)} />
              <Detail label="Target" value={formatDateTime(task.targetDate)} />
              <Detail
                label="Completed"
                value={formatDateTime(
                  task.status === "completed" || task.status === "submitted"
                    ? task.completeDate
                    : submission?.submittedAt
                )}
              />
            </div>
          </Section>

          {/* PEOPLE */}
          <Section title="People" icon={<Users size={18} className="text-pink-600" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <Detail label="Assigned By" value={task.assignedBy || "-"} />
              <Detail label="Assigned To" value={task.assignedTo || "-"} />
            </div>
            <div className="mt-4">
  <p className="text-gray-700 text-sm">Developer(s)</p>
  {displayedDomain ? (
    <p className="text-gray-900">
      {task.domains?.find((d) => d.name === displayedDomain)?.developers?.length
        ? task.domains
            ?.find((d) => d.name === displayedDomain)
            ?.developers.map((dev) => dev.name)
            .join(" • ")
        : "No developer assigned"}
    </p>
  ) : (
    <p className="text-gray-500">No domain selected.</p>
  )}
</div>


          </Section>

          {/* FILES */}
          <Section title="Attachment" icon={<Folder size={18} className="text-yellow-600" />}>
            <div className="grid md:grid-cols-2 gap-6">
              <FileBlock label="SOW Document" file={task.sowFile} url={task.sowUrl} buildFileUrl={buildFileUrl} />
              <FileBlock label="Input Document" file={task.inputFile} url={task.inputUrl} buildFileUrl={buildFileUrl} />
            </div>
          </Section>

          {/* BACK */}
          <div className="flex gap-4 pt-4 border-t border-gray-300">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md"
            >
              <ArrowLeft size={16} /> Back
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="bg-gray-100 rounded-xl shadow-lg p-6">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
    {children}
  </div>
);


interface DetailProps {
  label: string;
  value?: string | number;
}

const Detail: React.FC<DetailProps> = ({ label, value }) => (
  <div>
    <p className="text-gray-700 text-sm">{label}</p>
    <p className="text-gray-900 font-medium">{value ?? "-"}</p>
  </div>
);

interface FileBlockProps {
  label: string;
  file?: string;
  url?: string;
  buildFileUrl: (file: string | undefined) => string;
}

const FileBlock: React.FC<FileBlockProps> = ({ label, file, url, buildFileUrl }) => (
  <div>
    <p className="text-gray-700 text-sm">{label}</p>
    {file && (
      <a href={buildFileUrl(file)} className="text-blue-600 underline block" target="_blank" rel="noreferrer">
        View File
      </a>
    )}
    {url && (
      <a href={url} className="text-blue-600 underline block" target="_blank" rel="noreferrer">
        View File
      </a>
    )}
    {!file && !url && <p className="text-gray-500">-</p>}
  </div>
);

export default TaskDetail;

