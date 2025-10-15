


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";
import PageBreadcrumb from "../common/PageBreadCrumb";

interface TaskType {
  title: string;
  assignedBy: string;
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
  sowFile: File | null;
  sowUrl: string;
  inputFile: File | null;
  inputUrl: string;
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
    assignedBy: "",
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
    sowFile: null,
    sowUrl: "",
    inputFile: null,
    inputUrl: "",
  });

  const [domainInput, setDomainInput] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [assignedByOptions, setAssignedByOptions] = useState<UserOption[]>([]);
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
        setAssignedByOptions(data.filter((user: any) => user.role === "Sales"));
        setAssignedToOptions(data.filter((user: any) => (user.role === "TL" || user.role==="Manager")));
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const DeliveryTypes = ["API", "Data as a Service","Both"];
  const PlatformTypes = ["Web", "App", "Both"];

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
      setTask({ ...task, [name]: files[0] });
    } else {
      setTask({ ...task, [name]: value });
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
    if (!task.assignedBy) newErrors.assignedBy = "Assigned By is required";
    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.taskAssignedDate) newErrors.taskAssignedDate = "Assigned Date is required";
    if (!task.targetDate) newErrors.targetDate = "Target Date is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.typeOfPlatform) newErrors.typeOfPlatform = "Type of Platform is required";

    if (!task.sowFile && !task.sowUrl) newErrors.sowFile = "SOW Document (file or URL) is required";
    else if (!task.sowFile && task.sowUrl && !isValidDocumentUrl(task.sowUrl)) newErrors.sowUrl = "Invalid SOW URL";

    if (!task.inputFile && !task.inputUrl) newErrors.inputFile = "Input Document (file or URL) is required";
    else if (!task.inputFile && task.inputUrl && !isValidDocumentUrl(task.inputUrl)) newErrors.inputUrl = "Invalid Input URL";

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
        if (Array.isArray(value)) value.forEach((v) => formData.append(key, v));
        else formData.append(key, value as any);
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

  const renderFileDropArea = (file: File | null, name: keyof TaskType, label: string) => (
    <div
      onDrop={(e) => handleDrop(e, name)}
      onDragOver={handleDragOver}
      className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-400 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-400 transition bg-gray-100 text-gray-900"
    >
      {file ? (
      <div className="flex items-center gap-2">
        <span>{file.name}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTask({ ...task, [name]: null });
          }}
          className="text-red-500 hover:text-red-700 font-bold"
          title="Remove file"
        >
          ❌
        </button>
      </div>
    ) : (
      `Drag & Drop ${label} here or click to upload`
    )}
      {!file && (
      <input
        type="file"
        name={name}
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer top-0 left-0"
      />
    )}
    </div>
  );

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
              {["assignedBy", "assignedTo"].map((field) => (
                <div className="flex-1" key={field}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {field === "assignedBy" ? "Assigned By" : "Assigned To"} <span className="text-red-500">*</span>
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
                    {(field === "assignedBy" ? assignedByOptions : assignedToOptions).map((user) => (
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
                <input type="text" name="sowUrl" value={task.sowUrl} onChange={handleChange}
                  placeholder="Enter SOW Document URL" className="w-full h-18 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
                {renderError("sowUrl")}
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
                <input type="text" name="inputUrl" value={task.inputUrl} onChange={handleChange}
                  placeholder="Enter Input Document URL" className="w-full h-18 p-3 rounded-md bg-gray-100 border border-gray-300 text-gray-900" />
                {renderError("inputUrl")}
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
