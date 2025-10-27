// src/pages/EditTaskFullUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


interface Task {
  title: string;
  projectCode?: string;

  assignedTo: string;
  description: string;
  sampleFileRequired?: boolean;
  requiredValumeOfSampleFile?: number;
  taskAssignedDate: string;
  targetDate: string;
  completeDate: string;
  domains: Domain[];
  developers: Record<string, string[]>;
  typeOfDelivery: string;
  typeOfPlatform: string;
  status: string;
  sempleFile: boolean;
  sowFile: File[] | null;
  sowUrls: string[];
  inputFile: File[] | null;
  inputUrls: string[];
  outputFiles: File[] | null;
  outputUrls: string[];
  clientSampleSchemaFiles: File[] | null;
  clientSampleSchemaUrls: string[];
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
    assignedTo: "",
    description: "",
    sampleFileRequired: false,
    requiredValumeOfSampleFile: 0,
    taskAssignedDate: "",
    targetDate: "",
    completeDate: "",
    domains: [],
    developers: {},
    typeOfDelivery: "",
    typeOfPlatform: "",
    status: "in-progress",
    sempleFile: false,
    sowFile: [],
    sowUrls: [],
    inputFile: [],
    outputUrls: [],
    outputFiles: [],
    outputUrls: [],
    clientSampleSchemaFiles: [],
    clientSampleSchemaUrls: [],
  });

  const [domainInput, setDomainInput] = useState("");
  const [developerInput, setDeveloperInput] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [originalTask, setOriginalTask] = useState<Task | null>(null);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({
    sowUrls: "",
    inputUrls: "",
    outputUrls: "",
    clientSampleSchemaUrls: "",
  });

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

  //const assignedByOptions = users.filter((u) => u.role === "Sales");
  const assignedToOptions = users.filter((u) => (u.role === "TL" || u.role === "Manager"));
  const developerOptions = users.filter((u) => u.role === "Developer");
  const DeliveryTypes = ["API", "Data as a Service", "Both(API & Data As A Service)"];
  const PlatformTypes = ["Web", "App", "Both (App & Web)"];

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

  const buildFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http")) return fileUrl;
    const base = apiUrl.replace(/\/api$/, "");
    return `${base}/${fileUrl}`;
  };

  const normalizeDevelopers = (devs: Record<string, any>) => {
    const normalized: Record<string, string[]> = {};
    Object.entries(devs || {}).forEach(([domains, arr]) => {
      normalized[domains] = (arr as any[])
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

  const normalizeOption = (value: string, options: string[]) => {
    if (!value) return "";
    return options.find(opt => opt.toLowerCase() === value.toLowerCase()) || "";
  };


  const getUserNameById = (id: string) => {
    const user = users.find((u) => u._id === id);
    return user ? user.name : "";
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!task.title.trim()) newErrors.title = "Project title is required";

    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.taskAssignedDate) newErrors.taskAssignedDate = "Assigned Date is required";
    if (!task.targetDate) newErrors.targetDate = "Target Date is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.typeOfPlatform) newErrors.typeOfPlatform = "Type of Platform is required";

    const hasSowUrls = (task.sowUrls || []).some(url => url && url.trim() !== "");
    if ((task.sowFile || []).length === 0 && !hasSowUrls) {
      newErrors.sowFile = "SOW Document (file or URL) is required";
    } else if (hasSowUrls && !isValidDocumentUrl(task.sowUrls[0])) {
      newErrors.sowUrls = "Invalid SOW URL"; // 🔥 Use plural key
    }

    // Input Validation (check array length and first item validity)
    // const hasInputUrls = (task.inputUrls || []).some(url => url && url.trim() !== "");
    // if ((task.inputFile || []).length === 0 && !hasInputUrls) {
    //   newErrors.inputFile = "Input Document (file or URL) is required";
    // } else if (hasInputUrls && !isValidDocumentUrl(task.inputUrls[0])) {
    //   newErrors.inputUrls = "Invalid Input URL ()"; // 🔥 Use plural key
    // }

    // if (!task.outputFile && !task.outputUrl) newErrors.outputFile = "Output Document (file or URL) is required";
    // else if (task.outputUrl && !isValidDocumentUrl(task.outputUrl)) newErrors.outputUrl = "Invalid Output URL";

    if (task.sampleFileRequired && !task.requiredValumeOfSampleFile) {
      newErrors.requiredVolume = "Required volume is mandatory when sample file is required";
    }

    if (!task.domains || task.domains.length === 0) newErrors.domains = "At least one Platform is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --------------------------- HANDLERS -----------------------------

  const normalizeTaskData = (data: any): Task => {
    const toArray = (val: any): string[] =>
      Array.isArray(val) ? val : val ? [val] : [];

    // 🔹 Convert developers per domain into an object
    const developers: Record<string, string[]> = {};
    (data.domains || []).forEach((d: any) => {
      if (d.developers && Array.isArray(d.developers)) {
        developers[d.name] = d.developers.map(
          (dev: any) => (dev._id ? dev._id : dev) // keep only IDs
        );
      }
    });

    return {
      ...data,
      assignedBy: normalizeUserId(data.assignedBy),
      assignedTo: normalizeUserId(data.assignedTo),
      developers,
      domains: (data.domains || []).map((d: any) => ({
        name: d.name,
        status: d.status,
        developers: d.developers || [],
        submission: d.submission || {},
      })),
      typeOfDelivery: normalizeOption(data.typeOfDelivery, DeliveryTypes),
      typeOfPlatform: normalizeOption(data.typeOfPlatform, PlatformTypes),

      // FIX HERE — Always arrays
      sowFile: toArray(data.sowFiles),
      inputFile: toArray(data.inputFiles),
      outputFile: toArray(data.outputFiles),
      clientSampleSchemaFiles: toArray(data.clientSampleSchemaFiles),

      // Keep URLs safe
      sowUrls: toArray(data.sowUrls),
      inputUrls: toArray(data.inputUrls),
      outputUrls: toArray(data.outputUrls),
      clientSampleSchemaUrls: toArray(data.clientSampleSchemaUrls),

    };
  };

  useEffect(() => {
    if (!users.length || !id) return;

    if (!taskData) {
      fetch(`${apiUrl}/tasks/${id}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          const normalized = normalizeTaskData(data);
          setTask(normalized);
          setOriginalTask(normalized); // ✅ both set correctly
        })

        .catch(console.error);

    } else {
      setTask(normalizeTaskData(taskData));


    }
  }, [taskData, id, users]);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  //   const { name, files, value, type, checked } = e.target as HTMLInputElement;

  //   if (type === "checkbox") {
  //     setTask((prev) => ({ ...prev, [name]: checked }));
  //     return;
  //   }

  //   if (files && files.length > 0) {
  //     const selectedFiles = Array.from(files);
  //     setTask((prev) => ({
  //       ...prev,
  //       [name]: [...(prev[name as keyof Task] as File[] || []), ...selectedFiles],
  //     }));
  //   } else {
  //     // URL validation
  //     if (name.endsWith("Url") && value) {
  //       if (!isValidDocumentUrl(value)) {
  //         alert(`❌ ${name} must be a valid document link (PDF/DOC/DOCX/XLSX/PPT)`);
  //         return;
  //       }
  //     }
  //     setTask((prev) => ({ ...prev, [name]: value }));
  //   }
  // };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Note: We cast to HTMLInputElement here for files/type, but we still handle text/textarea/select
    const { name, files, value, type, checked } = e.target as HTMLInputElement;

    if (type === "checkbox") {
        setTask((prev) => ({ ...prev, [name]: checked }));
        return;
    }

    if (files && files.length > 0) {
        // User successfully selected one or more files (APPENDING)
        const selectedFiles = Array.from(files);
        setTask((prev) => ({
            ...prev,
            [name]: [...(prev[name as keyof Task] as File[] || []), ...selectedFiles],
        }));
    } else {
        // 🔑 CRITICAL FIX: If the element is a file input AND files.length is 0,
        // it means the user clicked 'Cancel'. Ignore the event and return.
        // We check if 'files' is defined to confirm it's a file input event.
        if (files) {
            return; 
        }

        // Handle regular text, textarea, or select input logic (REPLACING value)
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
      setErrors((prev) => ({ ...prev, domains: "Platform must start with http:// or https://" }));
      return;
    }

    if (!task.domains.some(d => d.name === trimmed)) {
      setTask(prev => ({
        ...prev,
        domains: [...prev.domains, { name: trimmed, status: "pending" }]
      }));
    }


    setDomainInput("");
  };

  const handleDomainRemove = (domains: string) => {
    const updatedDomains = task.domains.filter(d => d.name !== domains);
    const updatedDevelopers = { ...task.developers };
    delete updatedDevelopers[domains];
    setTask(prev => ({ ...prev, domains: updatedDomains, developers: updatedDevelopers }));
  };

  const handleDeveloperAdd = (domainName: string) => {
    const devId = developerInput[domainName];
    if (!devId) return;

    // Prevent duplicates across domains
    const alreadyAssigned = Object.values(task.developers).some(arr => arr.includes(devId));
    if (alreadyAssigned) {
      alert("This developer is already assigned!");
      return;
    }



    setTask(prev => ({
      ...prev,
      developers: {
        ...prev.developers,
        [domainName]: [...(prev.developers[domainName] || []), devId],
      },
    }));
    setDeveloperInput(prev => ({ ...prev, [domainName]: "" }));
  };

  // Place this near your other handler functions (e.g., after handleChange)

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUrlInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleUrlAdd = (name: keyof Task) => {
    const url = (urlInputs as any)[name]?.trim();
    if (!url) return;

    // You will need a global function 'isValidDocumentUrl' or define its logic here
    // if (!isValidDocumentUrl(url)) { 
    //   toast.error("Invalid URL format.");
    //   return;
    // }

    // Add the valid URL to the task's array
    setTask(prev => ({
      ...prev,
      [name]: [...(prev[name as keyof Task] as string[] || []), url],
    }));

    // Clear the input field
    setUrlInputs(prev => ({ ...prev, [name]: "" }));
  };

  const handleUrlRemove = (name: keyof Task, index: number) => {
    setTask(prev => ({
      ...prev,
      [name]: (prev[name as keyof Task] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleDeveloperRemove = (domainName: string, devId: string) => {
    setTask(prev => ({
      ...prev,
      developers: {
        ...prev.developers,
        [domainName]: prev.developers[domainName].filter(d => d !== devId),
      },
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
        Object.entries(task.developers).map(([domains, devs]) => [
          domains,
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
        } else if (key === "domains") {
          formData.append("domains", JSON.stringify(value));
        }
        else if (["sowUrls", "inputUrls", "outputUrls", "clientSampleSchemaUrls"].includes(key)) {
  const arr = Array.isArray(value)
    ? value.filter(Boolean)
    : typeof value === "string" && value
    ? [value]
    : [];
  formData.append(key, JSON.stringify(arr)); // ✅ send only what’s currently in UI
}


        // Handle multiple file arrays
        else if (["sowFile", "inputFile", "outputFile", "clientSampleSchemaFiles"].includes(key)) {
          (value as File[]).forEach((file) => {
            formData.append(key, file);
          });
        }
        else {
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
        toast.error("❌ Error updating task: " + JSON.stringify(data.errors || data));
        return;
      }

      console.log("Data",data);
      

      toast.success("✅ Task updated successfully!");
      setTimeout(() => navigate("/tasks"), 1500);
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error updating task!");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------- FILE DROP COMPONENT -----------------------------

  const renderFileDropArea = (
    files: File[] | string[] | null,
    name: keyof Task,
    label: string
  ) => {
    const fileList = Array.isArray(files) ? files : files ? [files] : [];

    return (
      <div className="mb-4">
        {/* 🔹 Drop area */}
        <div
          onDrop={(e) => handleDrop(e, name)}
          onDragOver={handleDragOver}
          className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-500 rounded-md p-6 cursor-pointer hover:border-blue-500 transition text-gray-700"
        >
          <span className="text-gray-700">
            Drag & Drop {label} here or click to upload
          </span>

          <input
            type="file"
            name={name}
            multiple
            onChange={handleChange}
            className="absolute w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        {/* 🔹 File list shown BELOW the drop area */}
        {fileList.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {fileList.map((file, i) => {
              const fileName =
                file instanceof File ? file.name : file.split("/").pop();
              const fileUrlOrPath = file instanceof File ? URL.createObjectURL(file) : (file as string);
              const finalUrl = buildFileUrl(fileUrlOrPath);

              return (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-100 p-2 rounded"
                >
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline truncate max-w-[80%]"
                  >
                    📄 {fileName}
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTask((prev) => ({
                        ...prev,
                        [name]: (prev[name] as any[]).filter((_, idx) => idx !== i),
                      }));
                    }}
                    className="text-red-500 hover:text-red-700 font-bold"
                    title="Remove file"
                  >
                    ❌
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // --------------------------- URL INPUT COMPONENT -----------------------------

  // const renderUrlInputArea = (
  //   name: "sowUrls" | "inputUrls" | "outputUrls" | "clientSampleSchemaUrls",
  //   label: string
  // ) => {
  //   // 1. Get the current value from the state. It will be a string containing all URLs.
  //   const currentUrlsString = (task[name] as string[] || []).join(', ');

  //   // 2. Parse the string into an array for display.
  //   // We use .filter(Boolean) to remove any empty strings resulting from extra commas.
  //   const urlList = currentUrlsString.split(',').map(url => url.trim()).filter(Boolean);

  //   const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const value = e.target.value;

  //     // Split the input string by comma, trim whitespace, and update the task state with the new array.
  //     const newUrlArray = value.split(',').map(url => url.trim()).filter(Boolean);

  //     setTask(prev => ({
  //       ...prev,
  //       [name]: newUrlArray, // The state is updated as an array of strings
  //     }));
  //   };

  //   // This helper function handles removal from the displayed list by editing the string in state.
  //   const handleRemove = (indexToRemove: number) => {
  //     // 1. Filter out the URL to be removed from the list array.
  //     const newUrlArray = urlList.filter((_, i) => i !== indexToRemove);

  //     // 2. Join the remaining URLs back into a comma-separated string to update the input/state.
  //     setTask(prev => ({
  //       ...prev,
  //       [name]: newUrlArray,
  //     }));
  //   };

  //   return (
  //     <div className="flex-1 mb-4">
  //       <label className="block font-medium mb-2">{label}</label>
  //       <input
  //         type="text"
  //         name={name}
  //         value={currentUrlsString}
  //         // The input value is the comma-separated string
  //         onChange={handleUrlChange}
  //         placeholder={`Enter ${label} URL`}
  //         className="flex-1 w-full p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
  //       />

  //       {/* List of added URLs (Shown below the input) */}
  //       {urlList.length > 0 && (
  //         <div className="mt-3 flex flex-col gap-2">
  //           {urlList.map((url, i) => (
  //             <div
  //               key={i}
  //               className="flex items-center justify-between bg-gray-100 p-2 rounded"
  //             >
  //               <a
  //                 href={url}
  //                 target="_blank"
  //                 rel="noreferrer"
  //                 className="text-blue-600 underline truncate max-w-[80%]"
  //               >
  //                 🔗 {url.length > 50 ? "..." + url.slice(-47) : url}
  //               </a>
  //               <button
  //                 type="button"
  //                 onClick={() => handleRemove(i)}
  //                 className="text-red-500 hover:text-red-700 font-bold"
  //                 title="Remove URL"
  //               >
  //                 ❌
  //               </button>
  //             </div>
  //           ))}
  //         </div>
  //       )}

  //       {/* Single Input for All URLs - User must separate URLs with a comma */}

  //       {/* Assuming errors state exists */}
  //       {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
  //     </div>
  //   );
  // };


  const renderUrlInputArea = (
    name: "sowUrls" | "inputUrls" | "outputUrls" | "clientSampleSchemaUrls",
    label: string
  ) => {
    // Get all existing URLs for this field
    const urlList = (task[name] as string[] || []).filter(Boolean);

    // Temporary input for new URL entry
    const [newUrl, setNewUrl] = useState("");

    const handleAddUrl = () => {
      const trimmed = newUrl.trim();
      if (!trimmed) return;
      if (!/^https?:\/\//i.test(trimmed)) {
        toast.error("Invalid URL — must start with http:// or https://");
        return;
      }

      // Add to task state
      setTask((prev) => ({
        ...prev,
        [name]: [...(prev[name] as string[] || []), trimmed],
      }));
      setNewUrl(""); // clear input
    };

    const handleRemoveUrl = (index: number) => {
      setTask((prev) => ({
        ...prev,
        [name]: (prev[name] as string[]).filter((_, i) => i !== index),
      }));
    };

    return (
      <div className="flex-1 mb-4">
        <label className="block font-medium mb-2">{label}</label>

        {/* Empty input only for adding new URL */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder={`Enter new ${label}`}
            className="flex-1 w-full p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* List of existing URLs */}
        {urlList.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {urlList.map((url, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-100 p-2 rounded"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline truncate max-w-[80%]"
                >
                  🔗 {url.length > 50 ? "..." + url.slice(-47) : url}
                </a>
                <button
                  type="button"
                  onClick={() => handleRemoveUrl(i)}
                  className="text-red-500 hover:text-red-700 font-bold"
                  title="Remove URL"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}

        {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
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
      <>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        {/* ...rest of your form */}
      </>

      <div className="min-h-screen w-full  dark:bg-gray-900 flex justify-center py-10 px-4">
        <div className="w-full max-w-7xl bg-gray-100 dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 lg:p-8">


          <h1 className="text-3xl font-semibold text-center text-[#3903a0] mb-8">{task.projectCode ? `[${task.projectCode}] ${task.title}` : "Edit Task"}</h1>
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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-1">


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
              {task.domains.map((d) => (
                <div key={d.name} className="bg-gray-50 dark:bg-white/[0.05] p-4 rounded-lg mb-3 border border-gray-200 dark:border-gray-700">
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
                        setDeveloperInput((prev) => ({ ...prev, [d.name]: e.target.value }))
                      }
                      className="flex-1 p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white/90"
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
                      Add Developer
                    </button>
                  </div>

                  <ul className="flex flex-wrap gap-2 mt-2">
                    {(task.developers[d.name] || []).map((devId) => {
                      const devName = users.find(u => u._id === devId)?.name || devId;
                      return (
                        <li key={devId} className="bg-gray-200 px-2 py-1 rounded flex items-center gap-2">
                          {devName}
                          <button
                            type="button"
                            onClick={() => handleDeveloperRemove(d.name, devId)}
                            className="text-red-500 hover:text-red-600"
                          >
                            ❌
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

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

              {errors.domains && <p className="text-red-500">{errors.domains}</p>}

              



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
                name="sampleFileRequired"
                
                checked={task.sampleFileRequired}
                onChange={handleChange}
              />
              Sample File Required?
            </label>
            {task.sampleFileRequired && (
                    <div className="flex-1">
                        <label className=" text-gray-700 font-medium mb-2 ">Required volume of sample file <span className="text-red-500">*</span></label>
                        <select
                            name=" requiredValumeOfSampleFile"
                            value={task. requiredValumeOfSampleFile}
                            onChange={handleChange}
                            className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900"
                        >
                            <option value="" hidden>Select Volume</option>
                            {["20", "50", "100", "500", "1000"].map((volume) => (
                                <option key={volume} value={volume}>
                                    {volume}
                                </option>
                            ))}
                        </select>
                     
                    </div>
                )}

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
                {errors.sowFile && <p className="text-red-500 text-sm mt-1">{errors.sowFile}</p>}
              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              {/* <div className="flex-1 h-18">
                <label className="block  font-medium mb-2">SOW Document URL</label>
                <input type="text" name="sowUrls" // 🔥 Changed to plural
                  value={task.sowUrls?.[0] || ""}
                  onChange={(e) => setTask({ ...task, sowUrls: [e.target.value] })}
                  placeholder="Enter SOW Document URL"
                  className="w-full p-3 h-18 rounded-md  border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.sowUrls && <p className="text-red-500 text-sm mt-1">{errors.sowUrls}</p>}
              </div> */}
              {renderUrlInputArea("sowUrls", "SOW Document URL(s)")}
            </div>

            {/* Input File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1">
                <label className="block  font-medium mb-2">Input Document File</label>
                {renderFileDropArea(task.inputFile, "inputFile", "Input File")}
                {errors.inputFile && <p className="text-red-500 text-sm mt-1">{errors.inputFile}</p>}
              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              {/* <div className="flex-1 h-18">
                <label className="block  font-medium mb-2">Input Document URL</label>
                <input type="text" name="inputUrls"
                  value={task.inputUrls?.[0] || ""}
                  onChange={(e) => setTask({ ...task, inputUrls: [e.target.value] })} placeholder="Enter Input Document URL" className="w-full p-3 h-18 rounded-md  border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.inputUrl && <p className="text-red-500 text-sm mt-1">{errors.inputUrl}</p>}
              </div> */}
              {renderUrlInputArea("inputUrls", "Input Document URL(s)")}
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1">
                <label className="block  font-medium mb-2">Client Sample Schema Document File</label>
                {renderFileDropArea(task.clientSampleSchemaFiles, "clientSampleSchemaFiles", "Client Sample Schema File")}

              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              {/* <div className="flex-1 h-18">
                <label className="block  font-medium mb-2">Client Sample Schema Document URL</label>
                <input type="text" name="clientSampleSchemaUrls"
                  value={task.clientSampleSchemaUrls?.[0] || ""}
                  onChange={(e) => setTask({ ...task, clientSampleSchemaUrls: [e.target.value] })} placeholder="Enter Client Sample Schema Document URL" className="w-full p-3 h-18 rounded-md  border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                
              </div> */}
              {renderUrlInputArea("clientSampleSchemaUrls", "Client Sample Schema URL(s)")}
            </div>


            {/* Output File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {/* File Section */}
              <div className="flex-1">
                <label className="block  font-medium mb-2">
                  Output Document File
                </label>


                {renderFileDropArea(task.outputFiles, "outputFiles", "Output File")}
                {errors.outputFile && <p className="text-red-500 text-sm mt-1">{errors.outputFile}</p>}
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
                      href={task.outputUrls?.[0]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-400 underline"
                    >
                      View Output URL
                    </a>
                  </div>
                )}


                <input
                  type="text"
                  name="outputUrls" // 🔥 Changed to plural
                  value={task.outputUrls} // 🔥 Access first element
                  onChange={(e) => setTask({ ...task, outputUrls: [e.target.value] })}
                  placeholder="Enter Output Document URL"
                  className="w-full p-3 rounded-md text-gray-700 border border-gray-600  focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
                />
                {errors.outputUrl && <p className="text-red-500 text-sm mt-1">{errors.outputUrl}</p>}
              </div>
            </div>
            {/* Submit */}
            <div>
              <button
                type="submit"

                className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Update Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditTaskUI;
