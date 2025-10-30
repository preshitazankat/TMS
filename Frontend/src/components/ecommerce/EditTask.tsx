// src/pages/EditTaskFullUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router"
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRef } from "react";


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

  clientSampleSchemaFile: File[] | null;
  clientSampleSchemaUrls: string[];
}

interface Domain {
  name: string;
  status: string;
  developers?: string[];
  submission?: {
    outputFiles?: File[] | null;
    outputUrl?: string[] | null;
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

    clientSampleSchemaFile: [],
    clientSampleSchemaUrls: [],
  });
  //console.log("helooo " , task)

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

  const allowedExtensions = ["pdf", "doc", "docs", "docx", "xls", "xlsx", "ppt", "pptx"];



  const isValidDocumentUrl = (url: string) => {
    // Pattern 1: URL must end with an allowed extension (for PDFs, DOCXs, etc.)
    const fileExtensionPattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join("|")})(\\?.*)?$`,
      "i"
    );

    // Pattern 2: Must be a recognizable Google Docs/Drive URL (for non-direct links)
    const googleDocsPattern = new RegExp(
      "^https?:\\/\\/docs\\.google\\.com\\/(document|spreadsheets|presentation)\\/d\\/.*$",
      "i"
    );

    return fileExtensionPattern.test(url) || googleDocsPattern.test(url);
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
      newErrors.sowUrls = "Invalid SOW URL ,url must be start with http or https";
    }

    const hasInputUrls = (task.inputUrls || []).some(url => url && url.trim() !== "");

    if (hasInputUrls && !isValidDocumentUrl(task.inputUrls[0])) {
      newErrors.inputUrls = "Invalid Input URL,url must be start with http or https ";
    }

    // Input Validation (check array length and first item validity)
    // const hasInputUrls = (task.inputUrls || []).some(url => url && url.trim() !== "");
    // if ((task.inputFile || []).length === 0 && !hasInputUrls) {
    //   newErrors.inputFile = "Input Document (file or URL) is required";
    // } else if (hasInputUrls && !isValidDocumentUrl(task.inputUrls[0])) {
    //   newErrors.inputUrls = "Invalid Input URL ()"; 
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
      outputFiles: toArray(data.outputFiles),
      clientSampleSchemaFile: toArray(data.clientSampleSchemaFile),

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




  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {

    const { name, files, value, type, checked } = e.target as HTMLInputElement;
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (type === "checkbox") {
      setTask((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (files && files.length > 0) {
      // User successfully selected one or more files (APPENDING)
      const selectedFiles = Array.from(files);
      setTask((prev) => ({
        ...prev,
        [name]: [...(prev[name as keyof Task] as File[] || []), ...selectedFiles],
      }));
    } else {

      if (files) {
        return;
      }


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

  // --------------------------- FILE DROP COMPONENT -----------------------------


//     const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) return;
//     setLoading(true);

//     try {
//       const formData = new FormData();

//       // 🔹 Convert developer names → IDs before sending
//       const developersForBackend = Object.fromEntries(
//         Object.entries(task.developers).map(([domain, devs]) => [
//           domain,
//           devs.map((d) => {
//             const found = users.find((u) => u.name === d || u._id === d);
//             return found ? found._id : d;
//           }),
//         ])
//       );

//       const fileKeys = ["sowFile", "inputFile", "clientSampleSchemaFiles"];
//       const fieldMap: Record<string, string> = {
//         sowFile: "sowFile",
//         inputFile: "inputFile",
       
//         clientSampleSchemaFiles: "clientSampleSchemaFile",
//       };

//       // ✅ 1️⃣ Handle kept (existing) file paths ONCE
//       fileKeys.forEach((key) => {
//         const files = task[key as keyof Task];
//         if (Array.isArray(files)) {
//           const keptPaths: string[] = files.filter((f) => typeof f === "string") as string[];
//           formData.append(`${key}Kept`, JSON.stringify(keptPaths));
//         }
//       });

//       // ✅ 2️⃣ Handle top-level fields
//       Object.entries(task).forEach(([key, value]) => {
//         if (value === null || value === undefined || value === "") return;

//         if (key === "outputFiles") {
//     return;
//   }

//         if (key === "developers") {
//           formData.append("developers", JSON.stringify(developersForBackend));
//         } else if (key === "domains") {
//           // handled later
//           return;
//         } else if (
//           ["sowUrls", "inputUrls", "clientSampleSchemaUrl"].includes(key)
//         ) {
//           const arr = Array.isArray(value)
//             ? value.filter(Boolean)
//             : typeof value === "string" && value
//               ? [value]
//               : [];
//           formData.append(key, JSON.stringify(arr));
//         }
        
//          else if (fileKeys.includes(key)) {
//           // ✅ Only add *new uploads* here
//           (value as File[]).forEach((f) => {
//             if (f instanceof File) formData.append(fieldMap[key], f);
//           });
//         } else {
//           formData.append(key, value as any);
//         }
//       });

//       const keptOutputFiles = {}; // Collect all kept files into one object

// task.domains.forEach((domain) => {
//   formData.append("domainNames", domain.name);

//   // New uploaded files (ADDITION)
//   if (domain.submission?.outputFiles?.length) {
//     domain.submission.outputFiles.forEach((file) => {
//       if (file instanceof File) {
//         // This is where new files are added to FormData
//         formData.append("outputFiles", file);
//         formData.append("outputFileDomains", domain.name);
//       }
//     });
//   }

//   // Kept output files (DELETION preparation)
//   const keptFiles = domain.submission?.outputFiles?.filter(
//     (f) => typeof f === "string" // Filter for existing file paths only
//   );
//   if (keptFiles?.length) {
//     keptOutputFiles[domain.name] = keptFiles;
//   }
  
//   // ... (Your logic for outputUrls remains here)
//   if (domain.submission?.outputUrls?.length) {
//     formData.append(
//       "outputUrls",
//       JSON.stringify({ [domain.name]: domain.submission.outputUrls })
//     );
//   }
// });

// // Finalize kept files after the loop to prevent duplicate entries/corruption
// if (Object.keys(keptOutputFiles).length) {
//     // This sends one, clean keptOutputFiles JSON string
//     formData.append("keptOutputFiles", JSON.stringify(keptOutputFiles)); 
// }

//       // ✅ 3️⃣ Handle per-domain submissions
//       task.domains.forEach((domain) => {
//         formData.append("domainNames", domain.name);

//         // new uploaded files
//         if (domain.submission?.outputFiles?.length) {
//           domain.submission.outputFiles.forEach((file) => {
//             if (file instanceof File) {
//               formData.append("outputFiles", file);
//               formData.append("outputFileDomains", domain.name);
//             }
//           });
//         }

//         // kept output files
//         const keptFiles = domain.submission?.outputFiles?.filter(
//           (f) => typeof f === "string"
//         );
//         if (keptFiles?.length) {
//           formData.append(
//             "keptOutputFiles",
//             JSON.stringify({ [domain.name]: keptFiles })
//           );
//         }

//         // output URLs
//         if (domain.submission?.outputUrls?.length) {
//           formData.append(
//             "outputUrls",
//             JSON.stringify({ [domain.name]: domain.submission.outputUrls })
//           );
//         }
//       });

//       // ✅ 4️⃣ Format dates
//       if (task.taskAssignedDate)
//         formData.set("taskAssignedDate", format(new Date(task.taskAssignedDate), "yyyy-MM-dd"));
//       if (task.targetDate)
//         formData.set("targetDate", format(new Date(task.targetDate), "yyyy-MM-dd"));
//       if (task.completeDate)
//         formData.set("completeDate", format(new Date(task.completeDate), "yyyy-MM-dd"));

//       console.log("📦 Final files before submit:", {
//         sowFile: task.sowFile,
//         inputFile: task.inputFile,
//         outputFiles: task.outputFiles,
//         clientSampleSchemaFile: task.clientSampleSchemaFile,
//       });

//       // ✅ 5️⃣ Submit to backend
//       const res = await fetch(`${apiUrl}/tasks/${id}`, {
//         method: "PUT",
//         body: formData,
//         credentials: "include",
//       });

//       const data = await res.json();
//       if (!res.ok) {
//         toast.error("❌ Error updating task: " + JSON.stringify(data.errors || data));
//         return;
//       }

//       toast.success("✅ Task updated successfully!");
//       setTimeout(() => navigate("/tasks"), 1500);
//     } catch (err) {
//       console.error("❌ Error updating task:", err);
//       toast.error("❌ Error updating task!");
//     } finally {
//       setLoading(false);
//     }
//   };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  setLoading(true);

  try {
    const formData = new FormData();

    

    // 🔹 Convert developer names → IDs before sending
    const developersForBackend = Object.fromEntries(
      Object.entries(task.developers).map(([domain, devs]) => [
        domain,
        devs.map((d) => {
          const found = users.find((u) => u.name === d || u._id === d);
          return found ? found._id : d;
        }),
      ])
    );

    // ✅ 1️⃣ Handle kept (existing) top-level files
    const fileKeys = ["sowFile", "inputFile", "clientSampleSchemaFiles"];
    const fieldMap: Record<string, string> = {
      sowFile: "sowFile",
      inputFile: "inputFile",
      clientSampleSchemaFiles: "clientSampleSchemaFile",
    };

    fileKeys.forEach((key) => {
      const files = task[key as keyof Task];
      if (Array.isArray(files)) {
        const keptPaths = files.filter((f) => typeof f === "string");
        formData.append(`${key}Kept`, JSON.stringify(keptPaths));
      }
    });

    // ✅ 2️⃣ Handle simple top-level fields
    Object.entries(task).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      if (["outputFiles", "domains"].includes(key)) return;

      if (key === "developers") {
        formData.append("developers", JSON.stringify(developersForBackend));
      } else if (["sowUrls", "inputUrls", "clientSampleSchemaUrls"].includes(key)) {
        const arr = Array.isArray(value)
          ? value.filter(Boolean)
          : typeof value === "string" && value
          ? [value]
          : [];
        formData.append(key, JSON.stringify(arr));
      } else if (fileKeys.includes(key)) {
        (value as File[]).forEach((f) => {
          if (f instanceof File) formData.append(fieldMap[key], f);
        });
      } else {
        formData.append(key, value as any);
      }
    });

    // ✅ 3️⃣ Domain-based logic (output files + URLs)
    const keptOutputMap: Record<string, string[]> = {};
    const outputUrlsMap: Record<string, string[]> = {};

    

    (task.domains || []).forEach((domain) => {
  
  
  // Prepare kept list for this domain
  let keptFiles = domain.submission?.outputFiles?.filter(
    (f) => typeof f === "string"
  ) || [];

  // ✅ NEW: include both kept (string) and newly added files
  if (domain.submission?.outputFiles?.length) {
    
    domain.submission.outputFiles.forEach((file) => {
      if (file instanceof File) {
        // add file to upload formData
        formData.append("outputFiles", file);
        formData.append("outputFileDomains", domain.name);

        // this prevents deletion in backend
        const tempPath = `uploads/${file.name}`;
        keptFiles.push(tempPath);
      }
    });
  }


  // ✅ Save combined kept + new file paths
  if (keptFiles.length) {
    keptOutputMap[domain.name] = Array.from(new Set(keptFiles));
  }

  // ✅ Handle output URLs (no change)
  if (domain.submission?.outputUrls?.length) {
    outputUrlsMap[domain.name] = domain.submission.outputUrls;
  }
});


   

    if (Object.keys(keptOutputMap).length)
      formData.append("keptOutputFiles", JSON.stringify(keptOutputMap));

    if (Object.keys(outputUrlsMap).length)
      formData.append("outputUrls", JSON.stringify(outputUrlsMap));

    formData.append("domains", JSON.stringify(task.domains));


    // ✅ 4️⃣ Format dates
    if (task.taskAssignedDate)
      formData.set("taskAssignedDate", format(new Date(task.taskAssignedDate), "yyyy-MM-dd"));
    if (task.targetDate)
      formData.set("targetDate", format(new Date(task.targetDate), "yyyy-MM-dd"));
    if (task.completeDate)
      formData.set("completeDate", format(new Date(task.completeDate), "yyyy-MM-dd"));

    // ✅ 5️⃣ Submit to backend
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

    toast.success("✅ Task updated successfully!");
    setTimeout(() => navigate("/tasks"), 1500);
  } catch (err) {
    console.error("❌ Error updating task:", err);
    toast.error("❌ Error updating task!");
  } finally {
    setLoading(false);
  }
};

  const handleFileRemove = (name: keyof Task, index: number) => {
    setTask((prev) => {
      const updatedFiles = Array.isArray(prev[name])
        ? [...(prev[name] as (File | string)[])]
        : [];

      // Revoke old object URL if File
      const removedFile = updatedFiles[index];
      if (removedFile instanceof File) {
        URL.revokeObjectURL(removedFile as unknown as string);
      }

      updatedFiles.splice(index, 1);
      return { ...prev, [name]: updatedFiles };
    });

    // Clear actual <input type="file"> element value
    if (fileInputRefs.current[name]) {
      fileInputRefs.current[name]!.value = "";
    }
  };


  // console.log("📦 Final files before update:", {
  //   sowFile: task.sowFile,
  //   inputFile: task.inputFile,
  //   outputFiles: task.domains.outputFiles,
  //   clientSampleSchemaFiles: task.clientSampleSchemaFiles,
  // });

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});


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
            ref={(el) => (fileInputRefs.current[name] = el)}
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
                      handleFileRemove(name, i);
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

  const handleDomainOutputFileChange = (domainIndex: number, files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);

    setTask((prev) => {
      const updatedDomains = [...prev.domains];
      const domainCopy = { ...updatedDomains[domainIndex] };

      domainCopy.submission = {
        ...domainCopy.submission,
        outputFiles: [
          ...(domainCopy.submission?.outputFiles || []),
          ...selectedFiles,
        ],
      };

      updatedDomains[domainIndex] = domainCopy;
      return { ...prev, domains: updatedDomains };
    });
  };

  const handleDomainOutputUrlAdd = (domainIndex: number, url: string) => {
    if (!url.trim()) return;

    if (!/^https?:\/\//i.test(url.trim())) {
      toast.error("Invalid URL — must start with http:// or https://");
      return;
    }

    setTask((prev) => {
      const updatedDomains = [...prev.domains];
      const domainCopy = { ...updatedDomains[domainIndex] };

      domainCopy.submission = {
        ...domainCopy.submission,
        outputUrls: [
          ...(domainCopy.submission?.outputUrls || []),
          url.trim(),
        ],
      };

      updatedDomains[domainIndex] = domainCopy;
      return { ...prev, domains: updatedDomains };
    });
  };

  const handleDomainOutputUrlRemove = (domainIndex: number, index: number) => {
    setTask((prev) => {
      const updatedDomains = [...prev.domains];
      const domainCopy = { ...updatedDomains[domainIndex] };
      domainCopy.submission = {
        ...domainCopy.submission,
        outputUrls: domainCopy.submission?.outputUrls?.filter((_, i) => i !== index) || [],
      };
      updatedDomains[domainIndex] = domainCopy;
      return { ...prev, domains: updatedDomains };
    });
  };



  const showOutputSection = task.domains.some(domain => domain.status === 'submitted');
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
                Task Name <span className="text-red-500">*</span>
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
              <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Add New Platform
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
                  name="requiredValumeOfSampleFile"
                  value={task.requiredValumeOfSampleFile}
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

            

            {/* SOW File / URL */}
            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1 ">
                <label className="block  font-medium mb-2">SOW Document File</label>
                {renderFileDropArea(task.sowFile, "sowFile", "SOW File")}
                {errors.sowFile && <p className="text-red-500 text-sm mt-1">{errors.sowFile}</p>}
              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              
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
             
              {renderUrlInputArea("inputUrls", "Input Document URL(s)")}
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full ">
              <div className="flex-1">
                <label className="block  font-medium mb-2">Client Sample Schema Document File</label>
                {renderFileDropArea(task.clientSampleSchemaFiles, "clientSampleSchemaFiles", "Client Sample Schema File")}

              </div>
              <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
              
              {renderUrlInputArea("clientSampleSchemaUrls", "Client Sample Schema URL(s)")}
            </div>



            

            {task?.domains && task.domains.length > 0 ? (
              <div className="space-y-6">
                {task.domains.map((domain, domainIndex) => {
                  const submission = domain.submission;

                  // Only show the domain if it has files/urls submitted
                  const hasSubmissionData = (submission?.outputFiles && submission.outputFiles.length > 0) || (submission?.outputUrls && submission.outputUrls.length > 0);

                  if (hasSubmissionData) {
                    return (
                      <div
                        key={domainIndex}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm"
                      >
                        <h4 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center justify-between">
                          <span>Domain: {domain.name}</span>
                          

                        </h4>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                         
                          {/* ✅ Output Document File Upload per Domain */}
                          <div className="flex-1">
                            <label className="block font-medium mb-2">
                              Output Document File
                            </label>

                            {/* Drop area & file input */}
                            <div
                              onDrop={(e) => {
                                e.preventDefault();
                                handleDomainOutputFileChange(domainIndex, e.dataTransfer.files);
                              }}
                              onDragOver={(e) => e.preventDefault()}
                              className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-500 rounded-md p-6 cursor-pointer hover:border-blue-500 transition text-gray-700"
                            >
                              <span className="text-gray-700">
                                Drag & Drop Submitted Output Files here or click to upload
                              </span>

                              <input
                                type="file"
                                multiple
                                onChange={(e) => handleDomainOutputFileChange(domainIndex, e.target.files)}
                                className="absolute w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>

                            {/* Show uploaded file list */}
                            {domain.submission?.outputFiles?.length > 0 && (
                              <div className="mt-3 flex flex-col gap-2">
                                {domain.submission.outputFiles.map((file, i) => {
                                  
                                  
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
                                          setTask((prev) => {
                                            const updatedDomains = [...prev.domains];
                                            const domainCopy = { ...updatedDomains[domainIndex] };
                                            domainCopy.submission = {
                                              ...domainCopy.submission,
                                              outputFiles: domainCopy.submission?.outputFiles?.filter(
                                                (_, idx) => idx !== i
                                              ),
                                            };
                                            updatedDomains[domainIndex] = domainCopy;
                                            return { ...prev, domains: updatedDomains };
                                          });
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




                          {/* Display Output URLs */}
                        
                          {/* ✅ Per-domain Output URL Input */}
                          <div className="flex-1 ">
                            <label className="block font-medium mb-2">
                              Output Document URL(s)
                            </label>

                            {/* Input + Add button */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={domain.submission?.tempUrl || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setTask((prev) => {
                                    const updatedDomains = [...prev.domains];
                                    const domainCopy = { ...updatedDomains[domainIndex] };
                                    domainCopy.submission = {
                                      ...domainCopy.submission,
                                      tempUrl: value, // temporary local field (not saved to backend)
                                    };
                                    updatedDomains[domainIndex] = domainCopy;
                                    return { ...prev, domains: updatedDomains };
                                  });
                                }}
                                placeholder="Enter output document URL"
                                className="flex-1 p-3 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleDomainOutputUrlAdd(domainIndex, domain.submission?.tempUrl || "");
                                  // clear tempUrl after add
                                  setTask((prev) => {
                                    const updatedDomains = [...prev.domains];
                                    const domainCopy = { ...updatedDomains[domainIndex] };
                                    domainCopy.submission = {
                                      ...domainCopy.submission,
                                      tempUrl: "",
                                    };
                                    updatedDomains[domainIndex] = domainCopy;
                                    return { ...prev, domains: updatedDomains };
                                  });
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                              >
                                Add
                              </button>
                            </div>

                            {/* Show existing URLs */}
                            {domain.submission?.outputUrls?.length > 0 && (
                              <div className="mt-3 flex flex-col gap-2">
                                {domain.submission.outputUrls.map((url, i) => (
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
                                      🔗 {url.length > 60 ? url.slice(0, 57) + "..." : url}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleDomainOutputUrlRemove(domainIndex, i)}
                                      className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                      ❌
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  }
                  return null; // Don't render domains without submission data
                })}
              </div>
            ) : (
              <p className="text-gray-500">No domains or output submissions found for this task.</p>
            )}

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
