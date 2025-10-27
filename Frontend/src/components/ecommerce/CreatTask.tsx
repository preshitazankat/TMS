


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";

interface TaskType {
  title: string;

  assignedTo: string;
  description: string;
  taskAssignedDate: string;
  targetDate: string;
  completeDate: string;
  domain: string[];
  typeOfDelivery: string;
  typeOfPlatform: string;
  status: string;
  sempleFile: boolean;
  sowFile: File[] | null;
  sowUrls: string[];
  inputFile: File[] | null;
  inputUrls: string[];
  clientSampleSchemaFiles: File[] | null;
  clientSampleSchemaUrls: string[];
}

interface UserOption {
  _id: string;
  name: string;
}

const CreateTaskUI: React.FC = () => {
  const navigate = useNavigate();

  const today = new Date();
  const twoDaysLater = addDays(today, 2);

  const [task, setTask] = useState<TaskType>({
    title: "",

    assignedTo: "",
    description: "",
    taskAssignedDate: format(today, "yyyy-MM-dd"),
    targetDate: format(twoDaysLater, "yyyy-MM-dd"),
    completeDate: "",
    domain: [],
    typeOfDelivery: "",
    typeOfPlatform: "",
    status: "pending",
    sempleFile: false,
    sowFile: [],
    sowUrls: [],
    inputFile: [],
    inputUrls: [],
    clientSampleSchemaFiles: [],
    clientSampleSchemaUrls: []
  });

  const [domainInput, setDomainInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  //const [assignedByOptions, setAssignedByOptions] = useState<UserOption[]>([]);
  const [assignedToOptions, setAssignedToOptions] = useState<UserOption[]>([]);

  const apiUrl = import.meta.env.VITE_API_URL;
  const allowedExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${apiUrl}/users/all`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();
        //setAssignedByOptions(data.filter((user: any) => user.role === "Sales"));
        setAssignedToOptions(data.filter((user: any) => (user.role === "TL" || user.role === "Manager")));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const DeliveryTypes = ["API", "Data as a Service", "Both(API & Data As A Service)"];
  const PlatformTypes = ["Web", "App", "Both (App & Web)"];

  const isValidDocumentUrl = (url: string) => {
    const pattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join("|")})(\\?.*)?$`,
      "i"
    );
    return pattern.test(url);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any;
    if (files) {
      const newFiles = Array.from(files);
      setTask((prev) => ({
        ...prev,
        [name]: [...(prev[name] || []), ...newFiles], // append files
      }));
    }
    else {
      const mappedName = name === "sowUrl" ? "sowUrls" : name === "inputUrl" ? "inputUrls" : name === "clientSampleSchemaUrl" ? "clientSampleSchemaUrls" : name;
      setTask({ ...task, [mappedName]: value });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, name: keyof TaskType) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setTask({ ...task, [name]: e.dataTransfer.files[0] });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setErrors((prev) => ({ ...prev, domain: 'Platform must start with "http://" or "https://"' }));
      return;
    }
    setErrors((prev) => ({ ...prev, domain: "" }));
    setTask({ ...task, domain: [...task.domain, trimmed] });
    setDomainInput("");
  };

  const handleDomainRemove = (index: number) => {
    const updatedDomains = [...task.domain];
    updatedDomains.splice(index, 1);
    setTask({ ...task, domain: updatedDomains });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDomainAdd();
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!task.title.trim()) newErrors.title = "Title is required";

    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.taskAssignedDate) newErrors.taskAssignedDate = "Assigned Date is required";
    if (!task.targetDate) newErrors.targetDate = "Target Date is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.typeOfPlatform) newErrors.typeOfPlatform = "Type of Platform is required";


    const hasSowUrls = (task.sowUrls || []).some(url => url && url.trim() !== "");

    if ((task.sowFile || []).length === 0 && !hasSowUrls)
      newErrors.sowFile = "SOW Document (file or URL) is required";
    else if (!task.sowFile && task.sowUrls && !isValidDocumentUrl(task.sowUrls[0])) newErrors.sowUrl = "Invalid SOW URL";

    const hasInputUrls = (task.inputUrls || []).some(url => url && url.trim() !== "");

    if ((task.inputFile || []).length === 0 && !hasInputUrls)
      newErrors.inputFile = "Input Document (file or URL) is required";
    else if (!task.inputFile && task.inputUrls && !isValidDocumentUrl(task.inputUrls[0])) newErrors.inputUrl = "Invalid Input URL";

    if (task.domain.length === 0) newErrors.domain = "At least one Platform is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      Object.entries(task).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else if (key === "sowUrls" || key === "inputUrls" || key === "clientSampleSchemaUrl" || key === "domain") {
          formData.append(key, JSON.stringify(value));
        }
        else {
          formData.append(key, value as any);
        }
      });


      const res = await fetch(`${apiUrl}/tasks`, {
        method: "POST",
        credentials: "include",

        body: formData,
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setErrors({ form: "Server error. Check file size and API." });
        return;
      }

      if (!res.ok) {
        setErrors({ form: "Error creating task: " + JSON.stringify(data.errors || data) });
        return;
      }

      alert("✅ Task created successfully!");
      navigate("/tasks");
    } catch (err) {
      console.error(err);
      setErrors({ form: "Unexpected error creating task" });
    }
  };

  const renderError = (field: string) => errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;

  const renderFileDropArea = (
    files: File[] | null,
    name: keyof TaskType,
    label: string
  ) => (
    <div
      onDrop={(e) => handleDrop(e, name)}
      onDragOver={handleDragOver}
      className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-400 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-400 transition bg-gray-100 text-gray-900"
    >
      {files && files.length > 0 ? (
        <ul className="w-full">
          {files.map((file, index) => (
            <li key={index} className="flex justify-between items-center py-1">
              <span>{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setTask((prev) => ({
                    ...prev,
                    [name]: prev[name].filter((_: any, i: number) => i !== index),
                  }));
                }}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ❌
              </button>
            </li>
          ))}
        </ul>
      ) : (
        `Drag & Drop ${label} here or click to upload`
      )}
      
      <input
        type="file"
        name={name}
        multiple
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
      />
     
    </div>
  );

// const renderFileDropArea = (
//   files: File[] | null,
//   name: keyof TaskType,
//   label: string
// ) => (
//   // Use a fragment or container div to hold both parts
//   <>
//     {/* 1. DROP AREA: Contains only the prompt and the hidden file input */}
//     <div
//       onDrop={(e) => handleDrop(e, name)}
//       onDragOver={handleDragOver}
//       className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-400 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-400 transition bg-gray-100 text-gray-900"
//     >
//       {/* Prompt Text */}
//       <div>
//         Drag & Drop {label} here or click to upload
//       </div>

//       {/* Hidden File Input (Covers only the drop area) */}
//       <input
//         type="file"
//         name={name}
//         multiple
//         onChange={handleChange}
//         className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
//       />
//     </div>

//     {/* 2. FILE LIST: Rendered BELOW the drop area, ensuring clicks do not trigger the file input */}
//     {files && files.length > 0 && (
//       <ul className="w-full mt-1 border border-gray-300 rounded-md p-2 bg-white">
//         {files.map((file, index) => (
//           <li
//             key={index}
//             className="flex justify-between items-center py-1 px-2 border-b last:border-b-0"
//           >
//             <span>{file.name}</span>
//             <button
//               type="button"
//               onClick={(e) => {
//                 // The structural change ensures this button is outside the file input's influence
//                 e.stopPropagation();
//                 setTask((prev) => ({
//                   ...prev,
//                   [name]: prev[name].filter((_: any, i: number) => i !== index),
//                 }));
//               }}
//               className="text-red-500 hover:text-red-700 font-bold"
//             >
//               ❌
//             </button>
//           </li>
//         ))}
//       </ul>
//     )}
//   </>
// );

  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
          { title: "Create Task" },
        ]}
      />
      <div className="min-h-screen w-full bg-white flex justify-center py-10 px-4">
        <div className="w-full max-w-6xl bg-gray-100 p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-semibold text-center text-[#3903a0] mb-8">Create New Task</h1>
          {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">

            {/* Title */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Project <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={task.title} onChange={handleChange}
                className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
              {renderError("title")}
            </div>

            {/* Assigned By & To */}
            <div className="flex flex-col md:flex-row gap-4 w-full">
              {["assignedTo"].map((field) => (
                <div className="flex-1" key={field}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {field === "assignedTo" ? "Assigned To" : "Assigned To"} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name={field}
                    value={String(task[field as keyof TaskType] || "")}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900"
                  >
                    <option value="" hidden>
                      Select Assignee
                    </option>
                    {(field === "assignedTo" && assignedToOptions).map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  {renderError(field)}
                </div>
              ))}
            </div>

            {/* Domain */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Platform <span className="text-red-500">*</span></label>
              <div className="flex gap-3 mb-2 flex-wrap w-full">
                <input type="text" value={domainInput} onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="https://www.xyz.com/"
                  className="flex-1 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
                <button type="button" onClick={handleDomainAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition">Add Platform</button>
              </div>
              <ul className="flex flex-wrap gap-2 w-full">
                {task.domain.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md text-gray-900 border border-gray-300">
                    {d}
                    <button type="button" onClick={() => handleDomainRemove(i)}
                      className="text-red-500 hover:text-red-600">❌</button>
                  </li>
                ))}
              </ul>
              {renderError("domain")}
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={task.description} onChange={handleChange}
                className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900 h-32" />
              {renderError("description")}
            </div>

            {/* Sample File */}
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 text-gray-900">
                <input type="checkbox" name="sempleFile" checked={task.sempleFile}
                  onChange={(e) => setTask({ ...task, sempleFile: e.target.checked })} className="h-4 w-4" />
                Sample File Required?
              </label>
            </div>

            {/* Type of Delivery & Platform */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Type of Delivery <span className="text-red-500">*</span></label>
                <select name="typeOfDelivery" value={task.typeOfDelivery} onChange={handleChange}
                  className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900">
                  <option value="" hidden>Select Type</option>
                  {DeliveryTypes.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
                {renderError("typeOfDelivery")}
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Type of Platform <span className="text-red-500">*</span></label>
                <select name="typeOfPlatform" value={task.typeOfPlatform} onChange={handleChange}
                  className="w-full p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900">
                  <option value="" hidden>Select Type</option>
                  {PlatformTypes.map((t) => <option key={t} value={t.toLowerCase()}>{t}</option>)}
                </select>
                {renderError("typeOfPlatform")}
              </div>
            </div>

            {/* SOW & Input */}
            <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">SOW Document File <span className="text-red-500">*</span></label>
                {renderFileDropArea(task.sowFile, "sowFile", "SOW File")}
                {renderError("sowFile")}
              </div>
              <div className="flex items-center font-bold text-gray-500 px-2">OR</div>
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">SOW Document URL</label>
                <input type="text" name="sowUrls" value={task.sowUrls[0] || ""}
                  // CreatTask.tsx: Replace the existing onChange with this for both sowUrls and inputUrls
                  onChange={(e) => {
                    // 💡 FIX: Ensure the state update is clean. inputUrls should only contain the new value.
                    const url = e.target.value.trim();
                    setTask(prev => ({
                      ...prev,
                      sowUrls: url ? [url] : [] // Store the URL as a single-element array, or an empty array if blank
                    }));
                  }}
                  placeholder="Enter SOW Document URL" className="w-full h-18 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
                {renderError("sowUrls")}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">Input Document File <span className="text-red-500">*</span></label>
                {renderFileDropArea(task.inputFile, "inputFile", "Input File")}
                {renderError("inputFile")}
              </div>
              <div className="flex items-center font-bold text-gray-500 px-2">OR</div>
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">Input Document URL</label>
                <input type="text" name="inputUrls" value={task.inputUrls[0] || ""}
                  // CreatTask.tsx: Replace the existing onChange with this for both sowUrls and inputUrls
                  onChange={(e) => {
                    // 💡 FIX: Ensure the state update is clean. inputUrls should only contain the new value.
                    const url = e.target.value.trim();
                    setTask(prev => ({
                      ...prev,
                      inputUrls: url ? [url] : [] // Store the URL as a single-element array, or an empty array if blank
                    }));
                  }}
                  placeholder="Enter Input Document URL" className="w-full h-18 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
                {renderError("inputUrls")}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">Client Sample Schema Document File <span className="text-red-500">*</span></label>
                {renderFileDropArea(task.clientSampleSchemaFiles, "clientSampleSchemaFiles", "Client Sample Schema File")}
             
              </div>
              <div className="flex items-center font-bold text-gray-500 px-2">OR</div>
              <div className="flex-1">
                <label className="block text-gray-700 font-medium mb-2">Client Sample Schema  Document URL</label>
                <input type="text" name="clientSampleSchemaUrls" value={task.clientSampleSchemaUrls?.[0] || ""}
                  // CreatTask.tsx: Replace the existing onChange with this for both sowUrls and inputUrls
                  onChange={(e) => {
                    // 💡 FIX: Ensure the state update is clean. inputUrls should only contain the new value.
                    const url = e.target.value.trim();
                    setTask(prev => ({
                      ...prev,
                      clientSampleSchemaUrls: url ? [url] : [] // Store the URL as a single-element array, or an empty array if blank
                    }));
                  }}
                  placeholder="Enter clientSampleSchema Document URL" className="w-full h-18 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
               
              </div>
            </div>

            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition w-full">
              Create Task
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateTaskUI;
