import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays } from "date-fns";

const CreateTask = () => {
  const navigate = useNavigate();

  const today = new Date();
  const twoDaysLater = addDays(today, 2);

  const [task, setTask] = useState({
    title: "",
    assignedBy: "",
    assignedTo: "",
    description: "",
    taskAssignedDate: today,
    targetDate: twoDaysLater,
    completeDate: "",
    domain: [],
    //priority: "Medium",
    typeOfDelivery: "",
    typeOfPlatform: "",
    status: "pending",
    sempleFile:false,
    sowFile: null,
    sowUrl: "",
    inputFile: null,
    inputUrl: "",
  });

  const [domainInput, setDomainInput] = useState("");
  const [errors, setErrors] = useState({});

  const AssignedBy = ["Pradeep Laungani",
    "Sunil Veluri",
    "Sejal Gandhi",
    "Sakshi Ahuja",
    "Anasrafi malek",
    "devansh vyas",
    "Vijay Pawar",
    "Jaykrishnan Nair",
    "Rutvika Girase",
    "Anagha Udaykumar"];
  const AssignedTo = ["Bhargav Joshi", "Krushil Gajjar"];

  //  const Devloper = ["Bhargav Joshi", "Nirmal Patel", "Hrithik Joshi", "Shivam Soni",
  // "Danesh Sharma",
  // "Ajay Chauhan",
  // "Ayush Thakkar",
  // "Ayush Patel",
  // "Atul Kumar",
  // "Sandhya Kumari",
  // "Khushi Patel",
  // "Drashti Pipaliya"];


  const apiUrl = import.meta.env.VITE_API_URL;
  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  const isValidDocumentUrl = (url) => {
    const pattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join('|')})(\\?.*)?$`,
      'i'
    );
    return pattern.test(url);
  };

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    if (files) {
      setTask({ ...task, [name]: files[0] });
    } else {
      setTask({ ...task, [name]: value });
    }
  };

  const handleDrop = (e, name) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setTask({ ...task, [name]: e.dataTransfer.files[0] });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;
    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, domain: "Platform must start with http:// or https://" }));
      return;
    }
    setErrors((prev) => ({ ...prev, domain: "" }));
    setTask({ ...task, domain: [...task.domain, trimmed] });
    setDomainInput("");
  };

  const handleDomainRemove = (index) => {
    const updatedDomains = [...task.domain];
    updatedDomains.splice(index, 1);
    setTask({ ...task, domain: updatedDomains });
    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      alert('❌ platform must start with "http://" or "https://"');
      setDomainInput("");
      return;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDomainAdd();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!task.title.trim()) newErrors.title = "Title is required";
    if (!task.assignedBy) newErrors.assignedBy = "Assigned By is required";
    if (!task.assignedTo) newErrors.assignedTo = "Assigned To is required";
    if (!task.description.trim()) newErrors.description = "Description is required";
    if (!task.taskAssignedDate) newErrors.taskAssignedDate = "Assigned Date is required";
    if (!task.targetDate) newErrors.targetDate = "Target Date is required";
    if (!task.typeOfDelivery) newErrors.typeOfDelivery = "Type of Delivery is required";
    if (!task.typeOfPlatform) newErrors.typeOfPlatform = "Type of Platform is required";
    

    // ✅ At least one SOW required
  if (!task.sowFile && !task.sowUrl) {
    newErrors.sowFile = "SOW Document (file or URL) is required";
  } else if (!task.sowFile && task.sowUrl && !isValidDocumentUrl(task.sowUrl)) {
    newErrors.sowUrl = "Invalid SOW Document URL";
  }

  // ✅ At least one Input required
  if (!task.inputFile && !task.inputUrl) {
    newErrors.inputFile = "Input Document (file or URL) is required";
  } else if (!task.inputFile && task.inputUrl && !isValidDocumentUrl(task.inputUrl)) {
    newErrors.inputUrl = "Invalid Input Document URL";
  }
    if (task.domain.length === 0) {
      newErrors.domain = "At least one Platform is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (!validateForm()) return;

    try {
      const formData = new FormData();
      Object.entries(task).forEach(([key, value]) => {
        if (Array.isArray(value)) value.forEach((v) => formData.append(key, v));
        else formData.append(key, value);
      });

      const res = await fetch(`${apiUrl}/tasks`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: "Error creating task: " + JSON.stringify(data.errors || data) });
        return;
      }

      alert("✅ Task created successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      setErrors({ form: "Unexpected error creating task" });
    }
  };

  const renderError = (field) =>
    errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;

  const renderFileDropArea = (file, name, label) => (
    <div
      onDrop={(e) => handleDrop(e, name)}
      onDragOver={handleDragOver}
      className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-500 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-500 transition bg-gray-700"
    >
      {file ? <span className="text-gray-100">{file.name || file}</span>
        : <span className="text-gray-400">Drag & Drop {label} here or click to upload</span>}
      <input
        type="file"
        name={name}
        onChange={handleChange}
        className="absolute w-full h-full opacity-0 cursor-pointer"
      />
    </div>
  );

  

  return (
    <div className="min-h-screen w-full bg-gray-900 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-blue-400 mb-8">
          Create New Task
        </h1>

        {errors.form && <p className="text-red-500 text-center mb-4">{errors.form}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">

          {/* Title */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Project <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              value={task.title}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
            />
            {renderError("title")}
          </div>

          {/* Assigned By & To */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {["assignedBy", "assignedTo"].map((field) => (
              <div className="flex-1" key={field}>
                <label className="block text-gray-300 font-medium mb-2">
                  {field === "assignedBy" ? "Assigned By" : "Assigned To"}

                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name={field}
                  value={task[field]}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
                >
                  <option value="" hidden>Select Assignee</option>
                  {(field === "assignedBy" ? AssignedBy : AssignedTo).map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {renderError(field)}
              </div>
            ))}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Platform <span className="text-red-500">*</span></label>
            <div className="flex gap-3 mb-2 flex-wrap w-full">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.xyz.com/"
                className="flex-1 p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
              />
              <button
                type="button"
                onClick={handleDomainAdd}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
              >
                Add Platform
              </button>
            </div>
            <ul className="flex flex-wrap gap-2 w-full">
              {task.domain.map((d, i) => (
                <li key={i} className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-md text-gray-100">
                  {d}
                  <button
                    type="button"
                    onClick={() => handleDomainRemove(i)}
                    className="text-red-500 hover:text-red-600"
                  >❌</button>
                </li>
              ))}
            </ul>
            {renderError("domain")}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              name="description"
              value={task.description}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 h-32"
            />
            {renderError("description")}
          </div>

          {/* Dates */}
          {/* <div className="w-full flex flex-col  md:flex-row gap-4">
            {["taskAssignedDate", "targetDate",].map((dateField) => (
              <div key={dateField} className="w-full md:w-1/3">
                <label className="block text-gray-300 font-medium mb-1">
                  {dateField === "taskAssignedDate"
                    ? "Assigned Date"
                    : dateField === "targetDate"
                      ? "Target Date"
                      : "Completion Date"}
                </label>
                <DatePicker
                  selected={task[dateField] ? new Date(task[dateField]) : null}
                  onChange={(date) => {
                    if (!date) return;
                    if (dateField === "taskAssignedDate") {
                      setTask({
                        ...task,
                        taskAssignedDate: format(date, "yyyy-MM-dd"),
                        targetDate: format(addDays(date, 2), "yyyy-MM-dd"),
                      });
                    } else {
                      setTask({ ...task, [dateField]: format(date, "yyyy-MM-dd") });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
                />
                {renderError(dateField)}
              </div>
            ))}
          </div> */}

          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-gray-100">
              <input
                type="checkbox"
                name="sempleFile"
                checked={task.sempleFile}
                onChange={(e) => setTask({ ...task, sempleFile: e.target.checked })}
                className="h-4 w-4" 
              />
              Sample File?
            </label>
            
          </div>

          {/* Type of Delivery */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Type of Delivery <span className="text-red-500">*</span></label>  
            <select
              name="typeOfDelivery"
              value={task.typeOfDelivery}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
            >
              <option value="" hidden>Select Type of Delivery</option>
              <option value="api">API</option>
              <option value="data service">Data Service</option>
            </select>
            {renderError("typeOfDelivery")}
          </div>


          {/* Type of Platform */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Type of Platform <span className="text-red-500">*</span></label>  
            <select
              name="typeOfPlatform"
              value={task.typeOfPlatform}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
            >
              <option value="" hidden>Select Type of Platform</option>
              <option value="web">Web</option>
              <option value="app">App</option>
              <option value="both">Both</option>
            </select>
            {renderError("typeOfPlatform")}
          </div>


          {/* SOW & Input File/URL */}
          <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">SOW Document File <span className="text-red-500">*</span></label>
              {renderFileDropArea(task.sowFile, "sowFile", "SOW File")}
              {renderError("sowFile")}
            </div>
            <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">SOW Document URL</label>
              <input
                type="text"
                name="sowUrl"
                value={task.sowUrl}
                onChange={handleChange}
                placeholder="Enter SOW Document URL"
                className="w-full h-18 p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
              />
              {renderError("sowUrl")}

            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1 h-18">
              <label className="block text-gray-300 font-medium mb-2">Input Document File <span className="text-red-500">*</span></label>
              {renderFileDropArea(task.inputFile, "inputFile", "Input File")}
              {renderError("inputFile")}
            </div>
            <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Input Document URL</label>
              <input
                type="text"
                name="inputUrl"
                value={task.inputUrl}
                onChange={handleChange}
                placeholder="Enter Input Document URL"
                className="w-full p-3 h-18 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
              />
              {renderError("inputUrl")}
            </div>
          </div>

          {/* Priority */}
          {/* <div>
            <label className="block text-gray-300 font-medium mb-2">Priority</label>
            <select
              name="priority"
              value={task.priority}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
            >
              <option value="High">🔴 High</option>
              <option value="Medium">🟠 Medium</option>
              <option value="Low">🟢 Low</option>

            </select>
          </div> */}

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition w-full"
          >
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTask;
