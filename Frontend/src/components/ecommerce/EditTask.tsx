// src/pages/EditTaskFullUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";

interface Task {
  title: string;
  projectCode?: string;
  assignedBy: string;
  assignedTo: string;
  description: string;
  taskAssignedDate: string;
  targetDate: string;
  completeDate: string;
  domain: string[];
  developers: Record<string, string[]>;
  typeOfDelivery: string;
  typeOfPlatform: string;
  status: string;
  sempleFile: boolean;
  sowFile: File | null;
  sowUrl: string;
  inputFile: File | null;
  inputUrl: string;
  outputFile: File | null;
  outputUrl: string;
}

interface Domain {
  name: string;
  status: string;
  developers?: string[];
  submission?: {
    files?: string[];
    outputUrl?: string | null;
  };
}




const EditTaskUI: React.FC<{ taskData?: Task }> = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [task, setTask] = useState<Task>({
    title: "",
    assignedBy: "",
    assignedTo: "",
    description: "",
    taskAssignedDate: "",
    targetDate: "",
    completeDate: "",
    domain: [],
    developers: {},
    typeOfDelivery: "",
    typeOfPlatform: "",
    status: "in-progress",
    sempleFile: false,
    sowFile: null,
    sowUrl: "",
    inputFile: null,
    inputUrl: "",
    outputFile: null,
    outputUrl: "",
  });

  const [domainInput, setDomainInput] = useState("");
  const [developerInput, setDeveloperInput] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<{ _id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include"
        });
        const data = await res.json();
        setUsers(data); // store all users
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  const assignedByOptions = users.filter((u) => u.role === "Sales");
  const assignedToOptions = users.filter((u) => u.role === "TL");
  const developerOptions = users.filter((u) => u.role === "Developer");





  const DeliveryTypes = ["API", "Data as a Service"];
  const PlatformTypes = ["Web", "App", "Both"];

  const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

  const isValidDocumentUrl = (url: string) => {
    const pattern = new RegExp(`^https?:\\/\\/.*\\.(${allowedExtensions.join("|")})(\\?.*)?$`, "i");
    return pattern.test(url);
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
    return null;
  };

  const token = getCookie("token");

  const normalizeUserId = (user: any) => {
    if (!user) return "";
    if (typeof user === "string" && /^[0-9a-fA-F]{24}$/.test(user)) return user;
    if (user._id) return user._id;
    // Try to map from users list by name
    const mapped = users.find((u) => u.name === user);
    return mapped ? mapped._id : "";
  };

  const normalizeDevelopers = (devs: Record<string, any>) => {
    const normalized: Record<string, string[]> = {};
    Object.entries(devs || {}).forEach(([domain, arr]) => {
      normalized[domain] = (arr as any[])
        .map((d) => {
          if (!d) return null;
          if (typeof d === "string" && /^[0-9a-fA-F]{24}$/.test(d)) return d;
          if (d._id) return d._id;
          const mapped = users.find((u) => u.name === d);
          return mapped ? mapped._id : null;
        })
        .filter(Boolean) as string[];
    });
    return normalized;
  };

  const getUserNameById = (id: string) => {
    const user = users.find((u) => u._id === id);
    return user ? user.name : "";
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!task.title.trim()) newErrors.title = "Project title is required";
    if (!task.assignedBy) newErrors.assignedBy = "Assigned By is required";
    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.taskAssignedDate) newErrors.taskAssignedDate = "Assigned Date is required";
    if (!task.targetDate) newErrors.targetDate = "Target Date is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.typeOfPlatform) newErrors.typeOfPlatform = "Type of Platform is required";

    if (!task.sowFile && !task.sowUrl) newErrors.sowFile = "SOW Document (file or URL) is required";
    else if (task.sowUrl && !isValidDocumentUrl(task.sowUrl)) newErrors.sowUrl = "Invalid SOW URL";

    if (!task.inputFile && !task.inputUrl) newErrors.inputFile = "Input Document (file or URL) is required";
    else if (task.inputUrl && !isValidDocumentUrl(task.inputUrl)) newErrors.inputUrl = "Invalid Input URL";

    // if (!task.outputFile && !task.outputUrl) newErrors.outputFile = "Output Document (file or URL) is required";
    // else if (task.outputUrl && !isValidDocumentUrl(task.outputUrl)) newErrors.outputUrl = "Invalid Output URL";

    if (!task.domain || task.domain.length === 0) newErrors.domain = "At least one Platform is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };



  // useEffect(() => {
  //   if (!taskData && id) {
  //     fetch(`${apiUrl}/tasks/${id}`, {
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include",
  //     })
  //       .then((res) => res.json())
  //       .then((data) => {
  //         // Normalize assignedBy / assignedTo / developers
  //         const normalizedTask: Task = {
  //           ...data,
  //           assignedBy: normalizeUserId(data.assignedBy),
  //           assignedTo: normalizeUserId(data.assignedTo),
  //           developers: normalizeDevelopers(data.developers),

  //           domains: (data.domains || []).map((d: any) => ({ name: d.name, status: d.status })),
  //           outputFile: Object.values(data.submissions || {})
  //             .map((sub: any) => sub.files)
  //             .filter(Boolean),
  //           outputUrl: data.outputUrl || "",
  //         };
  //         setTask(normalizedTask);
  //       })
  //       .catch(console.error);
  //   } else if (taskData) {
  //     const normalizedTask: Task = {
  //       ...taskData,
  //       assignedBy: normalizeUserId(taskData.assignedBy),
  //       assignedTo: normalizeUserId(taskData.assignedTo),
  //       developers: normalizeDevelopers(taskData.developers),
  //     };
  //     setTask(normalizedTask);
  //   }
  // }, [taskData, id, users]);


  // --------------------------- HANDLERS -----------------------------

  useEffect(() => {
    if (!users.length || !id) return;
    if (!taskData && id) {
      fetch(`${apiUrl}/tasks/${id}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          const normalizedTask: Task = {
            ...data,
            assignedBy: normalizeUserId(data.assignedBy),
            assignedTo: normalizeUserId(data.assignedTo),
            developers: normalizeDevelopers(data.developers),
            domain: (data.domains || []).map((d: any) => ({
              name: d.name,
              status: d.status,
              submission: {
            files: d.submission?.files || [],
            outputUrl: d.submission?.outputUrl || "",
          },
            })),

            outputFile:
          data.domains?.[0]?.submission?.files?.[0] || null, // ✅ use first submission file
        outputUrl: data.domains?.[0]?.submission?.outputUrl || "",
          };
          setTask(normalizedTask);
        })
        .catch(console.error);
    } else if (taskData) {
      const normalizedTask: Task = {
        ...taskData,
        assignedBy: normalizeUserId(taskData.assignedBy),
        assignedTo: normalizeUserId(taskData.assignedTo),
        developers: normalizeDevelopers(taskData.developers),
      };
      setTask(normalizedTask);
    }
  }, [taskData, id, users]);
  // ✅ Fetch task only after users are loaded so developer names can be resolved
  // useEffect(() => {
  //   if (!id || !users.length) return;

  //   const fetchTask = async () => {
  //     try {
  //       const res = await fetch(`${apiUrl}/tasks/${id}`, {
  //         headers: { "Content-Type": "application/json" },
  //         credentials: "include",
  //       });
  //       const data = await res.json();

  //       // Map developer IDs → names immediately
  //       const developers = {};
  //       (data.domains || []).forEach((d: any) => {
  //         developers[d.name] = (d.developers || []).map((devId: string) => {
  //           const user = users.find((u) => String(u._id) === String(devId));
  //           return user ? user.name : devId; // fallback to ID
  //         });
  //       });

  //       const normalizedTask: Task = {
  //         ...data,
  //         assignedBy: normalizeUserId(data.assignedBy),
  //         assignedTo: normalizeUserId(data.assignedTo),
  //         developers,
  //         domain: (data.domains || []).map((d: any) => ({
  //             name: d.name,
  //             status: d.status,
  //             submission: d.submission || { files: [], outputUrl: "" }
  //           })),
  //         outputFile: data.outputFile || null,
  //         outputUrl: data.outputUrl || "",
  //       };

  //       setTask(normalizedTask);
  //     } catch (error) {
  //       console.error("Error loading task:", error);
  //     }
  //   };

  //   fetchTask();
  // }, [id, users]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, files, value, type, checked } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setTask((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    if (files && files.length > 0) {
      setTask((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      // URL validation
      if (name.endsWith("Url") && value) {
        if (!isValidDocumentUrl(value)) {
          alert(`❌ ${name} must be a valid document link (PDF/DOC/DOCX/XLSX/PPT)`);
          return;
        }
      }
      setTask((prev) => ({ ...prev, [name]: value }));
    }
  };




  const handleDrop = (e: React.DragEvent<HTMLDivElement>, name: keyof Task) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setTask((prev) => ({ ...prev, [name]: e.dataTransfer.files[0] }));
    }
  };


  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;

    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, domain: "Platform must start with http:// or https://" }));
      return;
    }

    if (!task.domain.some(d => d.name === trimmed)) {
      setTask(prev => ({
        ...prev,
        domains: [...prev.domain, { name: trimmed, status: "pending" }]
      }));
    }


    setDomainInput("");
  };

  const handleDomainRemove = (domain: string) => {
    const updatedDomains = task.domains.filter(d => d.name !== domain);
    const updatedDevelopers = { ...task.developers };
    delete updatedDevelopers[domain];
    setTask(prev => ({ ...prev, domains: updatedDomains, developers: updatedDevelopers }));
  };

  const handleDeveloperAdd = (domain: string) => {
    const selectedDev = developerInput[domain];
    if (!selectedDev) return;

    // 🛑 Check if the developer is already assigned anywhere
    const alreadyAssigned = Object.values(task.developers || {}).some((devs) =>
      devs.includes(selectedDev)
    );

    if (alreadyAssigned) {
      alert("❌ This developer is already assigned to another domain!");
      return;
    }

    const devList = task.developers[domain] || [];
    if (!devList.includes(selectedDev)) {
      setTask((prev) => ({
        ...prev,
        developers: { ...prev.developers, [domain]: [...devList, selectedDev] },
      }));
    }

    setDeveloperInput((prev) => ({ ...prev, [domain]: "" }));
  };


  const handleDeveloperRemove = (domain: string, dev: string) => {
    setTask((prev) => ({
      ...prev,
      developers: { ...prev.developers, [domain]: prev.developers[domain].filter((d) => d !== dev) },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!validateForm()) return;
    try {
      const formData = new FormData();

      // Convert developer names → IDs before sending
      const developersForBackend = Object.fromEntries(
        Object.entries(task.developers).map(([domain, devs]) => [
          domain,
          devs.map((d) => {
            const found = users.find((u) => u.name === d || u._id === d);
            return found ? found._id : d;
          }),
        ])
      );

      Object.entries(task).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        if (key === "developers") {
          formData.append("developers", JSON.stringify(developersForBackend));
        } else if (key === "domain") {
          formData.append("domain", JSON.stringify(value));
        } else {
          formData.append(key, value as any);
        }
      });


      if (task.taskAssignedDate)
        formData.set("taskAssignedDate", format(new Date(task.taskAssignedDate), "yyyy-MM-dd"));
      if (task.targetDate)
        formData.set("targetDate", format(new Date(task.targetDate), "yyyy-MM-dd"));
      if (task.completeDate)
        formData.set("completeDate", format(new Date(task.completeDate), "yyyy-MM-dd"));

      const res = await fetch(`${apiUrl}/tasks/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ Error updating task: " + JSON.stringify(data.errors || data));
        return;
      }

      alert("✅ Task updated successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("❌ Error updating task!");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------- FILE DROP COMPONENT -----------------------------

  const renderFileDropArea = (file: File | string[] | null, name: string | undefined, label: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined) => {
    let fileName = null;

    if (file instanceof File) {
      fileName = file.name;
    } else if (Array.isArray(file)) {
      fileName = file.length > 0 ? file[0].split("/").pop() : null; // show first file
    } else if (typeof file === "string") {
      fileName = (file as string).split("/").pop();
    }

    return (
      <div
        onDrop={(e) => { if (name) handleDrop(e, name as keyof Task); }}
        onDragOver={handleDragOver}
        className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-500 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-500 transition text-gray-700"
      >
        {fileName ? (
          <span className="text-gray-700">{fileName}</span>
        ) : (
          <span className="text-gray-700">Drag & Drop {label} here or click to upload</span>
        )}
        <input
          type="file"
          name={name}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    );
  };
  // --------------------------- RENDER -----------------------------
  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
          { title: "Edit Task" },
        ]}
      />
      <div className="min-h-screen w-full bg-gray-100 dark:bg-gray-900 flex justify-center py-10 px-4">
        <div className="w-full max-w-7xl bg-white dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 lg:p-8">


          <h1 className="text-3xl font-semibold text-center text-blue-400 mb-8">{task.projectCode ? `[${task.projectCode}] ${task.title}` : "Edit Task"}</h1>
          {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}
          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {/* Title */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Project <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={task.title}
                onChange={handleChange}
                placeholder="Enter project title"
                className="w-full rounded-lg border border-gray-600  p-3  dark:border-gray-700 dark:bg-white/[0.05] dark:text-white/90"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Assigned By & To */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assigned By <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignedBy"
                  value={task.assignedBy}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600  p-3 dark:text-white/90"
                >
                  <option value="" hidden>Select Assignee</option>
                  {assignedByOptions.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {errors.assignedBy && <p className="text-red-500 text-sm mt-1">{errors.assignedBy}</p>}
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assigned To <span className="text-red-500">*</span>
                </label>
                <select
                  name="assignedTo"
                  value={task.assignedTo}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600  p-3 dark:text-white/90"
                >
                  <option value="" hidden>Select Assignee</option>
                  {assignedToOptions.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {errors.assignedTo && <p className="text-red-500 text-sm mt-1">{errors.assignedTo}</p>}
              </div>
            </div>

            {/* Platform & Developers */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Platform <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-3 mb-4 flex-wrap">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="https://www.example.com"
                  className="flex-1 rounded-lg border border-gray-600  p-3 dark:text-white/90"
                />
                <button
                  type="button"
                  onClick={handleDomainAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Add
                </button>
              </div>

              {errors.domain && <p className="text-red-500">{errors.domain}</p>}

              {task.domain.map((d) =>
                <div
                  key={d.name}
                  className="bg-gray-50 dark:bg-white/[0.05] p-4 rounded-lg mb-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDomainRemove(d.name)}
                      className="text-red-500 hover:text-red-600"
                    >
                      ❌
                    </button>
                  </div>

                  <div className="flex gap-3 items-end flex-wrap">
                    <select
                      value={developerInput[d.name] || ""}
                      onChange={(e) =>
                        setDeveloperInput((prev) => ({
                          ...prev,
                          [d.name]: e.target.value,
                        }))
                      }
                      className="flex-1 p-3 rounded-lg border  border-gray-300 dark:border-gray-600 dark:text-white/90"
                    >
                      <option value="" hidden>Select Developer</option>
                      {developerOptions.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleDeveloperAdd(d.name)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                      Add Dev
                    </button>
                  </div>

                  <ul className="flex flex-wrap gap-2 mt-2">
                    {(task.developers[d.name] || []).map((dev) => {
                      // resolve developer name
                      const devName =
                        typeof dev === "string"
                          ? users.find((u) => u._id === dev)?.name || dev
                          : dev.name; // if already object
                      return (
                        <li key={typeof dev === "string" ? dev : dev._id} className="bg-gray-200 ...">
                          {devName}
                          <button
                            type="button"
                            onClick={() => handleDeveloperRemove(d.name, typeof dev === "string" ? dev : dev._id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            ❌
                          </button>
                        </li>
                      );
                    })}
                  </ul>





                </div>
              )}


            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={task.description}
                onChange={handleChange}
                rows={4}
                placeholder="Write task description..."
                className="w-full rounded-lg border border-gray-600  p-3 dark:text-white/90"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>

            {/* Sample File */}
            <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                name="sempleFile"
                checked={task.sempleFile}
                onChange={handleChange}
              />
              Sample File?
            </label>

            {/* Type of Delivery & Platform */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Type of Delivery
                </label>
                <select
                  name="typeOfDelivery"
                  value={task.typeOfDelivery}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600  p-3"
                >
                  <option value="" hidden>Select Type</option>
                  {DeliveryTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.typeOfDelivery && <p className="text-red-500 text-sm mt-1">{errors.typeOfDelivery}</p>}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  Type of Platform
                </label>
                <select
                  name="typeOfPlatform"
                  value={task.typeOfPlatform}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600  p-3"
                >
                  <option value="" hidden>Select Type</option>
                  {PlatformTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}

                </select>
                {errors.typeOfPlatform && <p className="text-red-500 text-sm mt-1">{errors.typeOfPlatform}</p>}
              </div>
            </div>

            {/* File Uploads */}
            {/* {renderFileDropWithURL("SOW", "sowFile", "sowUrl")}
          {renderFileDropWithURL("Input", "inputFile", "inputUrl")}
          {renderFileDropWithURL("Output", "outputFile", "outputUrl")} */}

            {/* SOW File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1 ">
                <label className="block  font-medium mb-2">SOW Document File</label>
                {renderFileDropArea(task.sowFile, "sowFile", "SOW File")}
              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              <div className="flex-1 h-18">
                <label className="block  font-medium mb-2">SOW Document URL</label>
                <input type="text" name="sowUrl" value={task.sowUrl || ""} onChange={handleChange} placeholder="Enter SOW Document URL" className="w-full p-3 h-18 rounded-md  border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Input File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1">
                <label className="block  font-medium mb-2">Input Document File</label>
                {renderFileDropArea(task.inputFile, "inputFile", "Input File")}
              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              <div className="flex-1 h-18">
                <label className="block  font-medium mb-2">Input Document URL</label>
                <input type="text" name="inputUrl" value={task.inputUrl || ""} onChange={handleChange} placeholder="Enter Input Document URL" className="w-full p-3 h-18 rounded-md  border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Output File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {/* File Section */}
              <div className="flex-1">
                <label className="block  font-medium mb-2">
                  Output Document File
                </label>

                {/* Show already uploaded file */}
                {task?.outputFile && !(task.outputFile instanceof File) && (
                  <div className="mb-2">
                    <a
                      href={`${apiUrl}/${task.outputFile}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 underline"
                    >

                    </a>
                  </div>
                )}

                {/* Upload new file */}
                {renderFileDropArea(task.outputFile, "outputFile", "Output File")}
              </div>

              {/* OR Divider */}
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>

              {/* URL Section */}
              <div className="flex-1">
                <label className="block  font-medium mb-2">
                  Output Document URL
                </label>

                {/* Show already saved URL */}
                {task.outputUrl && (
                  <div className="mb-2">
                    <a
                      href={task.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-400 underline"
                    >
                      🌐 View Output URL
                    </a>
                  </div>
                )}


                <input
                  type="text"
                  name="outputUrl"
                  value={task.outputUrl || ""}
                  onChange={handleChange}
                  placeholder="Enter Output Document URL"
                  className="w-full p-3 rounded-md text-gray-700 border border-gray-600  focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
                />
              </div>
            </div>
            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditTaskUI;
