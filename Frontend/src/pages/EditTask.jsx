// src/pages/EditTask.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const EditTask = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState({
    title: "",
    assignedBy: "",
    assignedTo: "",
    description: "",
    taskAssignedDate: "",
    targetDate: "",
    completeDate: "",
    domain: [],
    developers: {},
    // priority: "Medium",
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
  const [developerInput, setDeveloperInput] = useState({});
  const [errors, setErrors] = useState({});
  const names = ["Krushil", "Preshita", "Vivek", "Aakanksha", "Hritik"];

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

  const Devloper = ["Bhargav Joshi", "Nirmal Patel", "Hrithik Joshi", "Shivam Soni",
    "Danesh Sharma",
    "Ajay Chauhan",
    "Ayush Thakkar",
    "Ayush Patel",
    "Atul Kumar",
    "Sandhya Kumari",
    "Khushi Patel",
    "Drashti Pipaliya"];

  const apiUrl = import.meta.env.VITE_API_URL;

  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  const isValidDocumentUrl = (url) => {
    // Must start with http/https and end with allowed extension
    const pattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join('|')})(\\?.*)?$`,
      'i'
    );
    return pattern.test(url);
  };

  useEffect(() => {
    if (!taskData && id) {
      fetch(`${apiUrl}/tasks/${id}`)
        .then(res => res.json())
        .then(data => {
          const submissions = data.submissions || {};


          const files = Object.values(submissions)
            .map(sub => sub.files)
            .filter(Boolean);

          setTask({ ...data, developers: data.developers || {}, outputFile: files, outputUrl: data.outputUrl || "", });
          console.log(data.outputFile);
          console.log(data);

        })
        .catch(console.error);
    } else if (taskData) {
      setTask({ ...taskData, developers: taskData.developers || {} });
    }
  }, [taskData, id]);

  const handleChange = (e) => {
    const { name, files, value } = e.target;
    if (files) setTask({ ...task, [name]: files[0] });
    else setTask({ ...task, [name]: value });
    if (name === 'sowUrl' && value) {
      if (!isValidDocumentUrl(value)) {
        alert('❌ SOW Document URL must be a valid document link (PDF/DOC/DOCX/XLSX/PPT)');
        setTask({ ...task, sowUrl: "" });
        return; // stop update
      }
    }
    if (name === 'inputUrl' && value) {
      if (!isValidDocumentUrl(value)) {
        alert('❌ Input Document URL must be a valid document link (PDF/DOC/DOCX/XLSX/PPT)');
        setTask({ ...task, inputUrl: "" });
        return;
      }
    }
    if (name === 'outputUrl' && value) {
      if (!isValidDocumentUrl(value)) {
        alert('❌ Output Document URL must be a valid document link (PDF/DOC/DOCX/XLSX/PPT)');
        setTask({ ...task, outputUrl: "" });
        return;
      }
    }

  };

  const handleDrop = (e, name) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setTask({ ...task, [name]: e.dataTransfer.files[0] });
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // Domain & Developer management
  const handleDomainAdd = () => {
    const trimmed = domainInput.trim();
    if (!trimmed) return;


    const isValid = /^https?:\/\//i.test(trimmed);
    if (!isValid) {
      setErrors((prev) => ({ ...prev, domain: "Platform must start with http:// or https://" }));
      return;
    }

    if (!task.domain.includes(trimmed)) {
      setTask({ ...task, domain: [...task.domain, trimmed] });
    }

    setDomainInput("");
  };


  const handleDomainRemove = (domain) => {
    const updatedDomains = task.domain.filter((d) => d !== domain);
    const updatedDevelopers = { ...task.developers };
    delete updatedDevelopers[domain];
    setTask({ ...task, domain: updatedDomains, developers: updatedDevelopers });
  };

  const handleDeveloperAdd = (domain) => {
    const selectedDev = developerInput[domain];  // <-- pick only this domain's input
    if (!selectedDev) return;

    const devList = task.developers[domain] || [];
    if (!devList.includes(selectedDev)) {
      const updatedDevelopers = {
        ...task.developers,
        [domain]: [...devList, selectedDev],
      };
      setTask({ ...task, developers: updatedDevelopers });
    }

    // reset only this domain's input
    setDeveloperInput((prev) => ({ ...prev, [domain]: "" }));
  };


  const handleDeveloperRemove = (domain, dev) => {
    const updatedDevelopers = {
      ...task.developers,
      [domain]: task.developers[domain].filter((d) => d !== dev),
    };
    setTask({ ...task, developers: updatedDevelopers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();

      Object.entries(task).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;
        if (key === "developers" || key === "domain") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      // Ensure date fields are in YYYY-MM-DD format
      if (task.taskAssignedDate)
        formData.set("taskAssignedDate", format(new Date(task.taskAssignedDate), "yyyy-MM-dd"));
      if (task.targetDate)
        formData.set("targetDate", format(new Date(task.targetDate), "yyyy-MM-dd"));
      if (task.completeDate)
        formData.set("completeDate", format(new Date(task.completeDate), "yyyy-MM-dd"));

      const res = await fetch(`${apiUrl}/tasks/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        alert("❌ Error updating task: " + JSON.stringify(data.errors || data));
        return;
      }

      alert("✅ Task updated successfully!");
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("❌ Error updating task!");
    }
  };

  const renderFileDropArea = (file, name, label) => {
    let fileName = null;

    if (file instanceof File) {
      fileName = file.name;
    } else if (Array.isArray(file)) {
      fileName = file.length > 0 ? file[0].split("/").pop() : null; // show first file
    } else if (typeof file === "string") {
      fileName = file.split("/").pop();
    }

    return (
      <div
        onDrop={(e) => handleDrop(e, name)}
        onDragOver={handleDragOver}
        className="relative flex flex-col justify-center items-center border-2 border-dashed border-gray-500 rounded-md p-6 mb-2 cursor-pointer hover:border-blue-500 transition bg-gray-700"
      >
        {fileName ? (
          <span className="text-gray-100">{fileName}</span>
        ) : (
          <span className="text-gray-400">Drag & Drop {label} here or click to upload</span>
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


  return (
    <div className="min-h-screen w-full bg-gray-900 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-blue-400 mb-8">{task.projectCode ? `[${task.projectCode}] ${task.title}` : "Edit Task"}</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <span className="mr-2 mb-8 text-2xl text-white">Edit Task:</span>
          {/* Title */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Project</label>
            <input
              type="text"
              name="title"
              value={task.title}
              onChange={handleChange}
              className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Assigned By & To */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Assigned By</label>
              <select name="assignedBy" value={task.assignedBy} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="" hidden>Select Assignee</option>
                {AssignedBy.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Assigned To</label>
              <select name="assignedTo" value={task.assignedTo} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="" hidden>Select Assignee</option>
                {AssignedTo.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Domain & Developers */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Platform & Developers</label>
            <div className="flex gap-3 mb-2 flex-wrap w-full">
              <input type="text" value={domainInput} onChange={(e) => setDomainInput(e.target.value)} placeholder="https://www.xyz.com/" className="flex-1 p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <button type="button" onClick={handleDomainAdd} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition">Add Platform</button>

            </div>
            {errors.domain && <p className="text-red-500">{errors.domain}</p>}
            {task.domain.map((domain) => (
              <div key={domain} className="bg-gray-700 p-4 rounded-md mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-100">{domain}</span>
                  <button type="button" onClick={() => handleDomainRemove(domain)} className="text-red-500 hover:text-red-600">❌</button>
                </div>
                <div className="flex gap-3 items-end mb-2 flex-wrap">
                  <select value={developerInput[domain] || ""} onChange={(e) => setDeveloperInput((prev) => ({
                    ...prev,
                    [domain]: e.target.value,
                  }))} className="flex-1 p-3 rounded-md bg-gray-600 border border-gray-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="" hidden>Select Developer</option>
                    {Devloper.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <button type="button" onClick={() => handleDeveloperAdd(domain)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition">Add Dev</button>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {(task.developers[domain] || []).map((dev) => (
                    <li key={dev} className="flex items-center gap-2 bg-gray-600 px-3 py-1 rounded-md text-gray-100">
                      {dev}
                      <button type="button" onClick={() => handleDeveloperRemove(domain, dev)} className="text-red-500 hover:text-red-600">❌</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Description</label>
            <textarea name="description" value={task.description} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-vertical" />
          </div>

          {/* Dates */}
          {/* <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Assigned Date</label>
              <DatePicker
                selected={task.taskAssignedDate ? new Date(task.taskAssignedDate) : null}
                onChange={(date) =>
                  setTask({ ...task, taskAssignedDate: date ? format(date, "yyyy-MM-dd") : "" })
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Target Date</label>
              <DatePicker
                selected={task.targetDate ? new Date(task.targetDate) : null}
                onChange={(date) =>
                  setTask({
                    ...task,
                    targetDate: date ? format(date, "yyyy-MM-dd") : "",
                  })
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Completion Date</label>
              <DatePicker
                selected={task.completeDate ? new Date(task.completeDate) : null}
                onChange={(date) =>
                  setTask({
                    ...task,
                    completeDate: date ? format(date, "yyyy-MM-dd") : "",
                  })
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
            <label className="block text-gray-300 font-medium mb-2">Type of Delivery</label>
            <select name="typeOfDelivery" value={task.typeOfDelivery} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="" hidden>Select Type of Delivery</option>
              <option value="api">API</option>
              <option value="data service">Data Service</option>
            </select>
          </div>
          {/* Type of Platform */}
          <div>
            <label className="block text-gray-300 font-medium mb-2">Type of Platform</label>
            <select name="typeOfPlatform" value={task.typeOfPlatform} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="" hidden>Select Type of Platform</option>
              <option value="web">Web</option>
              <option value="app">App</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* SOW File / URL */}
          <div className="flex flex-col md:flex-row gap-4 w-full ">
            <div className="flex-1 ">
              <label className="block text-gray-300 font-medium mb-2">SOW Document File</label>
              {renderFileDropArea(task.sowFile, "sowFile", "SOW File")}
            </div>
            <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
            <div className="flex-1 h-18">
              <label className="block text-gray-300 font-medium mb-2">SOW Document URL</label>
              <input type="text" name="sowUrl" value={task.sowUrl || ""} onChange={handleChange} placeholder="Enter SOW Document URL" className="w-full p-3 h-18 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Input File / URL */}
          <div className="flex flex-col md:flex-row gap-4 w-full ">
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">Input Document File</label>
              {renderFileDropArea(task.inputFile, "inputFile", "Input File")}
            </div>
            <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
            <div className="flex-1 h-18">
              <label className="block text-gray-300 font-medium mb-2">Input Document URL</label>
              <input type="text" name="inputUrl" value={task.inputUrl || ""} onChange={handleChange} placeholder="Enter Input Document URL" className="w-full p-3 h-18 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Output File / URL */}
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* File Section */}
            <div className="flex-1">
              <label className="block text-gray-300 font-medium mb-2">
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
              <label className="block text-gray-300 font-medium mb-2">
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
                className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-18"
              />
            </div>
          </div>






          {/* Priority */}

          {/* <div>
            <label className="block text-gray-300 font-medium mb-2">Priority</label>
            <select name="priority" value={task.priority} onChange={handleChange} className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="High">🔴 High</option>
              <option value="Medium">🟠 Medium</option>
              <option value="Low">🟢 Low</option>
              
            </select>
          </div> */}

          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md w-full transition">💾 Update Task</button>
        </form>
      </div>
    </div>
  );
};

export default EditTask;
