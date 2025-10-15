import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import CreatableSelect from "react-select/creatable";
import { CloudCog } from "lucide-react";


const SubmitTask = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

  const allCountries = [
    { value: "Afghanistan", label: "Afghanistan" },
    { value: "Albania", label: "Albania" },
    { value: "Algeria", label: "Algeria" },
    { value: "Andorra", label: "Andorra" },
    { value: "Angola", label: "Angola" },
    { value: "Antigua and Barbuda", label: "Antigua and Barbuda" },
    { value: "Argentina", label: "Argentina" },
    { value: "Armenia", label: "Armenia" },
    { value: "Australia", label: "Australia" },
    { value: "Austria", label: "Austria" },
    { value: "Azerbaijan", label: "Azerbaijan" },
    { value: "Bahamas", label: "Bahamas" },
    { value: "Bahrain", label: "Bahrain" },
    { value: "Bangladesh", label: "Bangladesh" },
    { value: "Barbados", label: "Barbados" },
    { value: "Belarus", label: "Belarus" },
    { value: "Belgium", label: "Belgium" },
    { value: "Belize", label: "Belize" },
    { value: "Benin", label: "Benin" },
    { value: "Bhutan", label: "Bhutan" },
    { value: "Bolivia", label: "Bolivia" },
    { value: "Bosnia and Herzegovina", label: "Bosnia and Herzegovina" },
    { value: "Botswana", label: "Botswana" },
    { value: "Brazil", label: "Brazil" },
    { value: "Brunei", label: "Brunei" },
    { value: "Bulgaria", label: "Bulgaria" },
    { value: "Burkina Faso", label: "Burkina Faso" },
    { value: "Burundi", label: "Burundi" },
    { value: "Cabo Verde", label: "Cabo Verde" },
    { value: "Cambodia", label: "Cambodia" },
    { value: "Cameroon", label: "Cameroon" },
    { value: "Canada", label: "Canada" },
    { value: "Central African Republic", label: "Central African Republic" },
    { value: "Chad", label: "Chad" },
    { value: "Chile", label: "Chile" },
    { value: "China", label: "China" },
    { value: "Colombia", label: "Colombia" },
    { value: "Comoros", label: "Comoros" },
    { value: "Congo", label: "Congo" },
    { value: "Costa Rica", label: "Costa Rica" },
    { value: "Croatia", label: "Croatia" },
    { value: "Cuba", label: "Cuba" },
    { value: "Cyprus", label: "Cyprus" },
    { value: "Czechia", label: "Czechia" },
    { value: "Denmark", label: "Denmark" },
    { value: "Djibouti", label: "Djibouti" },
    { value: "Dominica", label: "Dominica" },
    { value: "Dominican Republic", label: "Dominican Republic" },
    { value: "Ecuador", label: "Ecuador" },
    { value: "Egypt", label: "Egypt" },
    { value: "El Salvador", label: "El Salvador" },
    { value: "Equatorial Guinea", label: "Equatorial Guinea" },
    { value: "Eritrea", label: "Eritrea" },
    { value: "Estonia", label: "Estonia" },
    { value: "Eswatini", label: "Eswatini" },
    { value: "Ethiopia", label: "Ethiopia" },
    { value: "Fiji", label: "Fiji" },
    { value: "Finland", label: "Finland" },
    { value: "France", label: "France" },
    { value: "Gabon", label: "Gabon" },
    { value: "Gambia", label: "Gambia" },
    { value: "Georgia", label: "Georgia" },
    { value: "Germany", label: "Germany" },
    { value: "Ghana", label: "Ghana" },
    { value: "Greece", label: "Greece" },
    { value: "Grenada", label: "Grenada" },
    { value: "Guatemala", label: "Guatemala" },
    { value: "Guinea", label: "Guinea" },
    { value: "Guinea-Bissau", label: "Guinea-Bissau" },
    { value: "Guyana", label: "Guyana" },
    { value: "Haiti", label: "Haiti" },
    { value: "Honduras", label: "Honduras" },
    { value: "Hungary", label: "Hungary" },
    { value: "Iceland", label: "Iceland" },
    { value: "India", label: "India" },
    { value: "Indonesia", label: "Indonesia" },
    { value: "Iran", label: "Iran" },
    { value: "Iraq", label: "Iraq" },
    { value: "Ireland", label: "Ireland" },
    { value: "Israel", label: "Israel" },
    { value: "Italy", label: "Italy" },
    { value: "Jamaica", label: "Jamaica" },
    { value: "Japan", label: "Japan" },
    { value: "Jordan", label: "Jordan" },
    { value: "Kazakhstan", label: "Kazakhstan" },
    { value: "Kenya", label: "Kenya" },
    { value: "Kiribati", label: "Kiribati" },
    { value: "Kuwait", label: "Kuwait" },
    { value: "Kyrgyzstan", label: "Kyrgyzstan" },
    { value: "Laos", label: "Laos" },
    { value: "Latvia", label: "Latvia" },
    { value: "Lebanon", label: "Lebanon" },
    { value: "Lesotho", label: "Lesotho" },
    { value: "Liberia", label: "Liberia" },
    { value: "Libya", label: "Libya" },
    { value: "Liechtenstein", label: "Liechtenstein" },
    { value: "Lithuania", label: "Lithuania" },
    { value: "Luxembourg", label: "Luxembourg" },
    { value: "Madagascar", label: "Madagascar" },
    { value: "Malawi", label: "Malawi" },
    { value: "Malaysia", label: "Malaysia" },
    { value: "Maldives", label: "Maldives" },
    { value: "Mali", label: "Mali" },
    { value: "Malta", label: "Malta" },
    { value: "Marshall Islands", label: "Marshall Islands" },
    { value: "Mauritania", label: "Mauritania" },
    { value: "Mauritius", label: "Mauritius" },
    { value: "Mexico", label: "Mexico" },
    { value: "Micronesia", label: "Micronesia" },
    { value: "Moldova", label: "Moldova" },
    { value: "Monaco", label: "Monaco" },
    { value: "Mongolia", label: "Mongolia" },
    { value: "Montenegro", label: "Montenegro" },
    { value: "Morocco", label: "Morocco" },
    { value: "Mozambique", label: "Mozambique" },
    { value: "Myanmar", label: "Myanmar" },
    { value: "Namibia", label: "Namibia" },
    { value: "Nauru", label: "Nauru" },
    { value: "Nepal", label: "Nepal" },
    { value: "Netherlands", label: "Netherlands" },
    { value: "New Zealand", label: "New Zealand" },
    { value: "Nicaragua", label: "Nicaragua" },
    { value: "Niger", label: "Niger" },
    { value: "Nigeria", label: "Nigeria" },
    { value: "North Korea", label: "North Korea" },
    { value: "North Macedonia", label: "North Macedonia" },
    { value: "Norway", label: "Norway" },
    { value: "Oman", label: "Oman" },
    { value: "Pakistan", label: "Pakistan" },
    { value: "Palau", label: "Palau" },
    { value: "Palestine", label: "Palestine" },
    { value: "Panama", label: "Panama" },
    { value: "Papua New Guinea", label: "Papua New Guinea" },
    { value: "Paraguay", label: "Paraguay" },
    { value: "Peru", label: "Peru" },
    { value: "Philippines", label: "Philippines" },
    { value: "Poland", label: "Poland" },
    { value: "Portugal", label: "Portugal" },
    { value: "Qatar", label: "Qatar" },
    { value: "Romania", label: "Romania" },
    { value: "Russia", label: "Russia" },
    { value: "Rwanda", label: "Rwanda" },
    { value: "Saint Kitts and Nevis", label: "Saint Kitts and Nevis" },
    { value: "Saint Lucia", label: "Saint Lucia" },
    { value: "Saint Vincent and the Grenadines", label: "Saint Vincent and the Grenadines" },
    { value: "Samoa", label: "Samoa" },
    { value: "San Marino", label: "San Marino" },
    { value: "Sao Tome and Principe", label: "Sao Tome and Principe" },
    { value: "Saudi Arabia", label: "Saudi Arabia" },
    { value: "Senegal", label: "Senegal" },
    { value: "Serbia", label: "Serbia" },
    { value: "Seychelles", label: "Seychelles" },
    { value: "Sierra Leone", label: "Sierra Leone" },
    { value: "Singapore", label: "Singapore" },
    { value: "Slovakia", label: "Slovakia" },
    { value: "Slovenia", label: "Slovenia" },
    { value: "Solomon Islands", label: "Solomon Islands" },
    { value: "Somalia", label: "Somalia" },
    { value: "South Africa", label: "South Africa" },
    { value: "South Korea", label: "South Korea" },
    { value: "South Sudan", label: "South Sudan" },
    { value: "Spain", label: "Spain" },
    { value: "Sri Lanka", label: "Sri Lanka" },
    { value: "Sudan", label: "Sudan" },
    { value: "Suriname", label: "Suriname" },
    { value: "Sweden", label: "Sweden" },
    { value: "Switzerland", label: "Switzerland" },
    { value: "Syria", label: "Syria" },
    { value: "Taiwan", label: "Taiwan" },
    { value: "Tajikistan", label: "Tajikistan" },
    { value: "Tanzania", label: "Tanzania" },
    { value: "Thailand", label: "Thailand" },
    { value: "Timor-Leste", label: "Timor-Leste" },
    { value: "Togo", label: "Togo" },
    { value: "Tonga", label: "Tonga" },
    { value: "Trinidad and Tobago", label: "Trinidad and Tobago" },
    { value: "Tunisia", label: "Tunisia" },
    { value: "Turkey", label: "Turkey" },
    { value: "Turkmenistan", label: "Turkmenistan" },
    { value: "Tuvalu", label: "Tuvalu" },
    { value: "Uganda", label: "Uganda" },
    { value: "Ukraine", label: "Ukraine" },
    { value: "United Arab Emirates", label: "United Arab Emirates" },
    { value: "United Kingdom", label: "United Kingdom" },
    { value: "United States", label: "United States" },
    { value: "Uruguay", label: "Uruguay" },
    { value: "Uzbekistan", label: "Uzbekistan" },
    { value: "Vanuatu", label: "Vanuatu" },
    { value: "Vatican City", label: "Vatican City" },
    { value: "Venezuela", label: "Venezuela" },
    { value: "Vietnam", label: "Vietnam" },
    { value: "Yemen", label: "Yemen" },
    { value: "Zambia", label: "Zambia" },
    { value: "Zimbabwe", label: "Zimbabwe" },
  ];



  const isValidDocumentUrl = (url) => {
    // Must start with http/https and end with allowed extension
    const pattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join('|')})(\\?.*)?$`,
      'i'
    );
    return pattern.test(url);
  };

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainFromUrl = searchParams.get("domain");
  const today = new Date();

  const [submission, setSubmission] = useState({
    platform: "",
    userLogin: false,
    loginType: "",
    credentials: "",
    domain: domainFromUrl || "",
    country: [],
    feasibleFor: "",
    approxVolume: "",
    method: "",
    proxyUsed: false,
    proxyName: "",
    perRequestCredit: "",
    totalRequest: "",
    lastCheckedDate: format(today, "yyyy-MM-dd"),
    complexity: "Medium",
    githubLink: "",
    files: [],
  });

  const [domains, setDomains] = useState([]); // <-- store domains here
  const countries = ["India", "USA", "UK", "Germany", "Australia"];
  const [taskDetails, setTaskDetails] = useState(null);
  const [errors, setErrors] = useState({});
  const [tempCountries, setTempCountries] = useState([]);


  // fetch task data if no prop passed
  useEffect(() => {
    if (taskData) {
      setSubmission(prev => ({
        ...prev,
        ...taskData,
        domain: domainFromUrl || taskData.domain || prev.domain,
        lastCheckedDate: taskData.lastCheckedDate
          ? taskData.lastCheckedDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        files: []
      }));
      if (taskData.developers) setDomains(Object.keys(taskData.developers));
      setTaskDetails(taskData);
    } else if (id) {
      fetch(`${apiUrl}/tasks/${id}`)
        .then(res => res.json())
        .then(data => {
          setSubmission(prev => ({
            ...prev,
            ...data,
            domain: domainFromUrl || data.domain || prev.domain,
            lastCheckedDate: data.lastCheckedDate
              ? data.lastCheckedDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            files: []
          }));
          setTaskDetails(data);
          if (data.developers) setDomains(Object.keys(data.developers));
        })
        .catch(console.error);
    }
  }, [taskData, id, domainFromUrl]);


  const handleAddCountries = () => {
    const selectedValues = tempCountries.map(c => c.value);
    setSubmission(prev => ({ ...prev, country: selectedValues }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked, multiple, files } = e.target;
    if (type === "checkbox") {
      setSubmission({ ...submission, [name]: checked });
    } else if (type === "file") {
      setSubmission({ ...submission, files: Array.from(files) });
    } else if (multiple) {
      // multi-select <select multiple>
      const selected = Array.from(options)
        .filter(o => o.selected)
        .map(o => o.value);
      setSubmission({ ...submission, [name]: selected });
    }
    else {
      setSubmission({ ...submission, [name]: value });
    }
    if (name === "approxVolume") {
      // allow N/A or digits + optional letters
      const isValid =
        /^\s*(\d+(\.\d+)?[KM]?|N\/A)\s*(,\s*(\d+(\.\d+)?[KM]?|N\/A)\s*)*$/.test(value.trim()) || /^n\/?a$/i.test(value.trim());

      if (!isValid && value !== "") {
        // you can show inline error instead of alert if you prefer
        alert("❌ Approx Volume must start with digits or be 'N/A'");
        return;
      }
    }

    if (name === "sowUrl" || name === "inputUrl") {
      if (value && !isValidDocumentUrl(value)) {
        alert(
          `❌ Invalid URL. Must start with http/https and end with one of: ${allowedExtensions.join(
            ", "
          )}`
        );
        setSubmission((prev) => ({ ...prev, [name]: "" }));
        return;
      }
    }
  };

  // Add validation function
  const validateForm = () => {
    const newErrors = {};

    if (!submission.domain) newErrors.domain = "Domain is required.";
    if (!submission.country || submission.country.length === 0) {
  newErrors.country = "Country is required.";
}

    if (!submission.approxVolume) newErrors.approxVolume = "Approx Volume is required.";
    if (!submission.method) newErrors.method = "Method is required.";
    if (!submission.lastCheckedDate) newErrors.lastCheckedDate = "Last Checked Date is required.";
    if (!submission.complexity) newErrors.complexity = "Complexity is required.";

    if (submission.userLogin && !submission.loginType) {
      newErrors.loginType = "Please select a login type.";
    }

    if (submission.proxyUsed) {
      if (!submission.proxyName) newErrors.proxyName = "Proxy Name is required.";
      if (!submission.perRequestCredit) newErrors.perRequestCredit = "Per Request Credit is required.";
      if (!submission.totalRequest) newErrors.totalRequest = "Total Request is required.";
    }

    if ((!submission.files || submission.files.length === 0) && !submission.sowUrl) {
      newErrors.sowUrl = "Upload a file or provide a SOW document URL.";
    }
   
    if (submission.githubLink) {
      const githubPattern = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      if (!githubPattern.test(submission.githubLink.trim())) {
        newErrors.githubLink = "Enter a valid GitHub repository URL.";
      }
    }

    setErrors(newErrors);
    // console.log("Validation Errors:", newErrors);

    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting:12321321", submission);
    if (!validateForm()) return;
    console.log("Submitting:", submission);

    try {
      const formData = new FormData();

      // Only include the fields relevant to the submission
      const fieldsToSend = [
        "platform",
        "userLogin",
      
        "country",
        
        "approxVolume",
        "method",
        "loginType",
        "credentials",
        "proxyUsed",
        "proxyName",
        "perRequestCredit",
        "totalRequest",
        "lastCheckedDate",
        "complexity",
        "githubLink",
        "outputFile",
        "sowUrl",
        "files",
        "remark",
      ];

      fieldsToSend.forEach((key) => {
        const value = submission[key];
        if (value === null || value === undefined || value === "") return;

        if (key === "files" && Array.isArray(value)) {
          value.forEach((file) => formData.append("files", file));
        } else {
          formData.append(key, value);
        }
      });


      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await fetch(`${apiUrl}/tasks/${id}/submit`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        alert("❌ Error submitting task: " + errText);
        return;
      }

      const data = await res.json();
      console.log("Returned task:", data);

      alert("✅ Task submitted successfully!");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("❌ Error submitting task!");
    }
  };


  return (
    <div className="min-h-screen w-full bg-gray-900 flex justify-center py-10 px-4">
      <div className="w-full max-w-6xl bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl text-center text-blue-400 font-semibold mb-8">
          {/* Project codes */}
          {Array.isArray(taskDetails?.projectCode)
            ? `[${taskDetails.projectCode.join(", ")}]`
            : taskDetails?.projectCode
              ? `[${taskDetails.projectCode}]`
              : "-"}
          {" "}
          {/* Title */}
          {taskDetails?.title || ""}
        </h2>

        <p className="mr-2 mb-8 text-white text-2xl">Submit Task:</p>
        {taskDetails && (
          <div className="bg-gray-800 p-6 rounded-2xl mb-8 shadow-lg border border-gray-700">

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl text-blue-400 font-semibold flex items-center gap-2">
                
                Task Platform & Submissions
              </h3>
            </div>

            <table className="min-w-full text-left border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-3 text-gray-300 font-medium">Platform</th>
                  <th className="px-4 py-3 text-gray-300 font-medium">Developers</th>
                  <th className="px-4 py-3 text-gray-300 font-medium">Submission Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(taskDetails.developers || {}).map((domain, idx) => {
                  const devs = taskDetails.developers[domain] || [];
                  const submissionStatus = taskDetails.submissions?.[domain]?.status || "pending";
                  const isSubmitted = submissionStatus.toLowerCase() === "submitted";
                  return (
                    <tr
                      key={domain}
                      className={idx % 2 === 0 ? "bg-gray-900 hover:bg-gray-700" : "bg-gray-800 hover:bg-gray-700"}
                    >
                      <td className="px-4 py-3 border-b border-gray-700 text-white">{domain}</td>
                      <td className="px-4 py-3 border-b border-gray-700 text-white">
                        {devs.length ? devs.join(", ") : "-"}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${isSubmitted
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                            }`}
                        >
                          {submissionStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}


        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Row 1 */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Platform</label>
              <input
                type="text"
                name="platform"
                value={submission.platform}
                onChange={handleChange}
                placeholder="Enter platform"
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div> */}
            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Platform</label>
              <input
                type="text"
                name="domain"
                value={submission.domain}
                readOnly
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100"
              />
              {errors.domain && <p className="text-red-400 text-sm mt-1">{errors.domain}</p>}
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Country <span className="text-red-500 pr-1">*</span></label>
              <CreatableSelect
                isMulti
                options={allCountries}
                value={submission.country.map(c => ({ value: c, label: c }))}
                onChange={(selected) =>
                  setSubmission((prev) => ({
                    ...prev,
                    country: selected ? selected.map((c) => c.value) : [],
                  }))
                }
               styles={{
    control: (base) => ({
      ...base,
      backgroundColor: "#374151", // Tailwind bg-gray-700
      borderColor: "#4B5563",     // Tailwind gray-600
      color: "white",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1F2937", // bg-gray-800
      color: "white",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#4B5563" // gray-600
        : state.isFocused
        ? "#6B7280" // gray-500
        : "#374151", // gray-700
      color: "white",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#4B5563",
      color: "white",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "white",
    }),
  }}
                placeholder="Search or select countries..."
              />
              {errors.country && (
                <p className="text-red-400 text-sm mt-1">{errors.country}</p>
              )}
            </div>

            {/* <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Feasible For</label>
              <input
                type="text"
                name="feasibleFor"
                value={submission.feasibleFor}
                onChange={handleChange}
                placeholder="Enter feasibility"
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.feasibleFor && (
                <p className="text-red-400 text-sm mt-1">{errors.feasibleFor}</p>
              )}
            </div> */}
          </div>

          {/* Row 3 */}
          {/* Row 3 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Approx Volume <span className="text-red-500 ml-1">*</span></label>
              <input
                type="text"
                name="approxVolume"
                value={submission.approxVolume}
                onChange={handleChange}
                placeholder="e.g. 45000 or 4M or N/A"
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Start with digits or enter 'N/A'</p>
              {errors.approxVolume && <p className="text-red-400 text-sm mt-1">{errors.approxVolume}</p>}
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Method <span className="text-red-500 ml-1">*</span></label>
              <select
                name="method"
                value={submission.method}
                onChange={handleChange}
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"

              >
                <option value="" hidden>Select Method</option>
                <option value="Browser Automation">Browser Automation</option>
                <option value="Request">Request</option>
                <option value="Semi Automation">Semi Automation</option>


              </select>
              {errors.method && <p className="text-red-400 text-sm mt-1">{errors.method}</p>}
            </div>
          </div>


          {/* Checkboxes */}
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 text-gray-100">
              <input
                type="checkbox"
                name="userLogin"
                checked={submission.userLogin}
                onChange={handleChange}
              />
              Login Required? 
            </label>
            <label className="flex items-center gap-2 text-gray-100">
              <input type="checkbox" name="proxyUsed" checked={submission.proxyUsed} onChange={handleChange} />
              Proxy Used?
            </label>
          </div>

          {submission.userLogin && (
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col">
                <label className="text-gray-300 mb-2">Login Type</label>
                <select
                  name="loginType"
                  value={submission.loginType}
                  onChange={handleChange}
                  className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" hidden>Select Login Type</option>
                  <option value="Free">Free Login</option>
                  <option value="Purchased login">Purchased Login</option>
                </select>
                {errors.loginType && (
                  <p className="text-red-400 text-sm mt-1">{errors.loginType}</p>
                )}
              </div>
            </div>
          )}

          {submission.userLogin && submission.loginType === "Purchased login" && (
            <div className="flex flex-col mt-4">
              <label className="text-gray-300 mb-2">Credential Details</label>
              <textarea
                name="credentials"
                value={submission.credentials}
                onChange={handleChange}
                placeholder="Enter purchased login credentials here..."
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}


          {/* Proxy fields */}
          {submission.proxyUsed && (
            <>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-gray-300 mb-2">Proxy Name</label>
                  <input
                    type="text"
                    name="proxyName"
                    value={submission.proxyName}
                    onChange={handleChange}
                    placeholder="Enter proxy name"
                    className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.proxyName && (
                    <p className="text-red-400 text-sm mt-1">{errors.proxyName}</p>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-gray-300 mb-2">Per Request Credit</label>
                  <input
                    type="number"
                    name="perRequestCredit"
                    value={submission.perRequestCredit}
                    onChange={handleChange}
                    placeholder="Enter per request credit"
                    className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     min="0"
                  />
                  {errors.perRequestCredit && (
                    <p className="text-red-400 text-sm mt-1">{errors.perRequestCredit}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-gray-300 mb-2">Total Requests</label>
                  <input
                    type="number"
                    name="totalRequest"
                    value={submission.totalRequest}
                    onChange={handleChange}
                    placeholder="Enter total requests"
                    className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                     min="0"
                  />
                  {errors.totalRequest && (
                    <p className="text-red-400 text-sm mt-1">{errors.totalRequest}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Row 4 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Last Checked Date</label>
              <DatePicker
                selected={submission.lastCheckedDate ? new Date(submission.lastCheckedDate) : null}
                onChange={(date) =>
                  setSubmission({ ...submission, lastCheckedDate: date ? format(date, "yyyy-MM-dd") : "" })
                }
                dateFormat="yyyy-MM-dd"
                placeholderText="YYYY-MM-DD"
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
               {errors.lastCheckedDate && (
                <p className="text-red-400 text-sm mt-1">{errors.lastCheckedDate}</p>
              )}
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-gray-300 mb-2">Complexity<span className="text-red-500 pr-1">*</span></label>
              <select
                name="complexity"
                value={submission.complexity}
                onChange={handleChange}
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
              {errors.complexity && (
                <p className="text-red-400 text-sm mt-1">{errors.complexity}</p>
              )}
            </div>
          </div>

          {/* GitHub link */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2">GitHub Repo Link</label>
            <input
              type="text"
              name="githubLink"
              value={submission.githubLink}
              onChange={handleChange}
              placeholder="Enter GitHub link"
              className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.githubLink && (
              <p className="text-red-400 text-sm mt-1">{errors.githubLink}</p>
            )}
          </div>


          {/* File + URL upload */}
          <div className="flex flex-col">
            <label className="text-gray-300 mb-2 font-medium">Attach Output Document <span className="text-red-500 ml-1">*</span></label>

            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* File Upload */}
              <div className="flex-1">
                <input
                  type="file"
                  name="files"
                  onChange={handleChange}
                  multiple
                  placeholder="Choose output file(s)"
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100
             focus:outline-none focus:ring-2 focus:ring-blue-500
             file:mr-4 file:py-2 file:px-4 file:rounded-md
             file:border-0 file:text-sm file:font-semibold
             file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                <p className="text-xs text-gray-400 mt-1">Upload file(s)</p>
                {errors.sowUrl && (
                  <p className="text-red-400 text-sm mt-1">{errors.sowUrl}</p>
                )}
              </div>

              {/* OR Divider */}
              <div className="flex items-center justify-center">
                <span className="text-gray-400 font-semibold">OR</span>
              </div>

              {/* Document URL */}
              <div className="flex-1">
                <input
                  type="text"
                  name="sowUrl"
                  value={submission.sowUrl || ""}
                  onChange={handleChange}
                  placeholder="Enter Output Document URL"
                  className="w-full p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 h-15"
                />
                <p className="text-xs text-gray-400 mt-1">Paste link to document</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col mt-4">
              <label className="text-gray-300 mb-2">Remark</label>
              <textarea
                name="credentials"
                value={submission.remark}
                onChange={handleChange}
                placeholder="Enter Remark here..."
                className="p-3 rounded-md bg-gray-700 border border-gray-600 text-gray-100 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
          </div>
           

          {/* Buttons */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition"
            >
              Submit Task
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-semibold transition"
            >
              ⬅️ Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitTask;
