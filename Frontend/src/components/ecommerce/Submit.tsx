// src/pages/SubmitTaskUI.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CreatableSelect from "react-select/creatable";
import { format } from "date-fns";
import { options } from "@fullcalendar/core/preact.js";
import PageBreadcrumb from "../common/PageBreadCrumb";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface SubmitTaskProps {
  taskData?: any;
}

interface Submission {
  [key: string]: any;
  platform: string;
  domain: string;
  country: string[];
  feasibleFor: string;
  approxVolume: string;
  method: string;
  userLogin: boolean;
  loginType: string;
  credentials: string;
  proxyUsed: boolean;
  proxyName: string;
  perRequestCredit: string;
  totalRequest: string;
  lastCheckedDate: string;
  complexity: string;
  githubLink: string;
  files: File[];
  sowUrl: string;
  remark: string;
}

const SubmitTaskUI: React.FC<SubmitTaskProps> = ({ taskData }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "ppt",
    "pptx",
  ];

  const allCountries = [
    { value: "Afghanistan", label: "Afghanistan" },
     { value: "Albania", label: "Albania" },
     { value: "Algeria", label: "Algeria" },
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
    {
      value: "Saint Vincent and the Grenadines",
      label: "Saint Vincent and the Grenadines",
    },
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

  const isValidDocumentUrl = (url: string) => {
    // Must start with http/https and end with allowed extension
    const pattern = new RegExp(
      `^https?:\\/\\/.*\\.(${allowedExtensions.join("|")})(\\?.*)?$`,
      "i"
    );
    return pattern.test(url);
  };
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const domainFromUrl = searchParams.get("domain");
  const today = new Date();

  const [submission, setSubmission] = useState<Submission>({
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
    sowUrl: "",
    remark: "",
  });

  const [domains, setDomains] = useState<string[]>([]);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (taskData) {
      setSubmission((prev) => ({
        ...prev,
        ...taskData,
        domain: domainFromUrl || taskData.domain || prev.domain,
        lastCheckedDate: taskData.lastCheckedDate
          ? taskData.lastCheckedDate.slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        files: [],
        country: Array.isArray(taskData.country)
          ? taskData.country
          : taskData.country
          ? [taskData.country]
          : [],
      }));
      if (taskData.developers) setDomains(Object.keys(taskData.developers));
      setTaskDetails(taskData);
    } else if (id) {
      fetch(`${apiUrl}/tasks/${id}`, { method: "GET", credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          setSubmission((prev) => ({
            ...prev,
            ...data,
            domain: domainFromUrl || data.domain || prev.domain,
            lastCheckedDate: data.lastCheckedDate
              ? data.lastCheckedDate.slice(0, 10)
              : new Date().toISOString().slice(0, 10),
            files: [],
            country: Array.isArray(data.country)
              ? data.country
              : data.country
              ? [data.country]
              : [],
          }));

          setTaskDetails(data);
          if (data.developers) setDomains(Object.keys(data.developers));
        })
        .catch(console.error);
    }
  }, [taskData, id, domainFromUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmission((prev) => ({
        ...prev,
        files: Array.from(e.target.files as FileList),
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const name = target.name;
    const value = target.value;
    const type = (target as HTMLInputElement).type;
    const checked = (target as HTMLInputElement).checked;
    const multiple = (target as HTMLSelectElement).multiple;
    const files = (target as HTMLInputElement).files;

    if (type === "checkbox") {
      setSubmission({ ...submission, [name]: checked });
    } else if (type === "file") {
      setSubmission({ ...submission, files: files ? Array.from(files) : [] });
    } else if (multiple) {
      // multi-select <select multiple>
      const selected = Array.from((target as HTMLSelectElement).options)
        .filter((o) => o.selected)
        .map((o) => o.value);
      setSubmission({ ...submission, [name]: selected });
    } else {
      setSubmission({ ...submission, [name]: value });
    }
    if (name === "approxVolume") {
      // allow N/A or digits + optional letters
      const isValid =
        /^\s*(\d+(\.\d+)?[KM]?|N\/A)\s*(,\s*(\d+(\.\d+)?[KM]?|N\/A)\s*)*$/.test(
          value.trim()
        ) || /^n\/?a$/i.test(value.trim());

      if (!isValid && value !== "") {
        // you can show inline error instead of alert if you prefer
        toast.error("❌ Approx Volume must start with digits or be 'N/A'");
        return;
      }
    }

    if (name === "sowUrl" || name === "inputUrl") {
      if (value && !isValidDocumentUrl(value)) {
        toast.error(
          `❌ Invalid URL. Must start with http/https and end with one of: ${allowedExtensions.join(
            ", "
          )}`
        );
        setSubmission((prev) => ({ ...prev, [name]: "" }));
        return;
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!submission.domain) newErrors.domain = "Domain is required.";
    if (!submission.country || submission.country.length === 0) {
      newErrors.country = "Country is required.";
    }

    if (!submission.approxVolume)
      newErrors.approxVolume = "Approx Volume is required.";
    if (!submission.method) newErrors.method = "Method is required.";
    if (!submission.lastCheckedDate)
      newErrors.lastCheckedDate = "Last Checked Date is required.";
    if (!submission.complexity)
      newErrors.complexity = "Complexity is required.";

    if (submission.userLogin && !submission.loginType) {
      newErrors.loginType = "Please select a login type.";
    }

    if (submission.proxyUsed) {
      if (!submission.proxyName)
        newErrors.proxyName = "Proxy Name is required.";
      if (!submission.perRequestCredit)
        newErrors.perRequestCredit = "Per Request Credit is required.";
      if (!submission.totalRequest)
        newErrors.totalRequest = "Total Request is required.";
    }

    if (
      (!submission.files || submission.files.length === 0) &&
      !submission.sowUrl
    ) {
      newErrors.sowUrl = "Upload a file or provide a SOW document URL.";
    }

    if (submission.githubLink) {
      const githubPattern =
        /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
      if (!githubPattern.test(submission.githubLink.trim())) {
        newErrors.githubLink = "Enter a valid GitHub repository URL.";
      }
    }

    setErrors(newErrors);
    // console.log("Validation Errors:", newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const formData = new FormData();

      // Append each field properly
      formData.append("platform", submission.platform || "");
      formData.append("domain", submission.domain || "");
      formData.append("country", JSON.stringify(submission.country)); // convert array to JSON string

      formData.append("approxVolume", submission.approxVolume || "");
      formData.append("method", submission.method || "");
      formData.append("userLogin", submission.userLogin ? "true" : "false"); // boolean as string
      formData.append("loginType", submission.loginType || "");
      formData.append("credentials", submission.credentials || "");
      formData.append("proxyUsed", submission.proxyUsed ? "true" : "false"); // boolean as string
      formData.append("proxyName", submission.proxyName || "");
      formData.append("perRequestCredit", submission.perRequestCredit || "");
      formData.append("totalRequest", submission.totalRequest || "");
      formData.append("lastCheckedDate", submission.lastCheckedDate || "");
      formData.append("complexity", submission.complexity || "");
      formData.append("githubLink", submission.githubLink || "");
      formData.append("sowUrl", submission.sowUrl || "");
      formData.append("remark", submission.remark || "");

      // Append files
      if (submission.files && submission.files.length > 0) {
        submission.files.forEach((file) => formData.append("files", file));
      }

      // Debug: see exactly what is being sent
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const res = await fetch(`${apiUrl}/tasks/${id}/submit`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errText = await res.text();
        toast.error("❌ Error submitting task: " + errText);
        return;
      }

      const data = await res.json();
      console.log("Returned task:", data);

      toast.success("✅ Task submitted successfully!");
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      toast.error("❌ Error submitting task!");
    }
  };

  const renderFileDropWithURL = (label: string) => (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <label className="block mb-2 text-sm font-medium text-gray-700 ">
          {label} Document File
        </label>
        <div className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer bg-gray-50 dark:bg-white/[0.05] text-gray-600 dark:text-white/80">
          Drag & Drop {label} File here or click to upload
          <input
            type="file"
            multiple
            name="files"
            onChange={handleChange}
            className="absolute opacity-0 w-full h-full top-0 left-0 cursor-pointer"
          />
          <p className="text-xs text-gray-400 mt-1">Upload file(s)</p>
          {errors.sowUrl && (
            <p className="text-red-400 text-sm mt-1">{errors.sowUrl}</p>
          )}
        </div>
      </div>
      <div className="flex items-center font-bold text-gray-400 px-2">OR</div>
      <div className="flex-1">
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} Document URL
        </label>
        <input
          type="text"
          value={submission.sowUrl}
          onChange={handleChange}
          name="sowUrl"
          placeholder={`Enter ${label} URL`}
          className="w-full h-18 rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800 dark:border-gray-700 dark:bg-white/[0.05] dark:text-white/90"
        />
      </div>
    </div>
  );

  return (
    <>
      <PageBreadcrumb
        items={[
          { title: "Home", path: "/" },
          { title: "Tasks", path: "/tasks" },
          { title: "Submit" },
        ]}
      />
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
      <div className="min-h-screen w-full   flex justify-center py-10 px-4">
        <div className="w-full max-w-7xl bg-gray-100 dark:bg-white/[0.03] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 lg:p-8">
          <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
            Submit Task
          </h3>
          <h2 className="text-3xl text-center text-blue-400 font-semibold mb-8">
            {/* Project codes */}
            {Array.isArray(taskDetails?.projectCode)
              ? `[${taskDetails.projectCode.join(", ")}]`
              : taskDetails?.projectCode
              ? `[${taskDetails.projectCode}]`
              : "-"}{" "}
            {/* Title */}
            {taskDetails?.title || ""}
          </h2>
          {taskDetails && (
            <div className=" p-6 rounded-2xl mb-8 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl text-blue-400 font-semibold flex items-center gap-2">
                  Task Platform & Submissions
                </h3>
              </div>

              <table className="min-w-full text-left border-collapse rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-500">
                    <th className="px-4 py-3 text-gray-300 font-medium">
                      Platform
                    </th>
                    <th className="px-4 py-3 text-gray-300 font-medium">
                      Developers
                    </th>
                    <th className="px-4 py-3 text-gray-300 font-medium">
                      Submission Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {taskDetails.domains?.map((domainObj, idx) => {
                    const devNames =
                      domainObj.developers?.map((dev) => dev.name) || [];
                    const submissionStatus = domainObj.status || "pending";
                    const isSubmitted =
                      submissionStatus.toLowerCase() === "submitted";

                    return (
                      <tr
                        key={idx}
                        className={
                          idx % 2 === 0
                            ? "bg-gray-100 hover:bg-gray-200"
                            : "bg-white hover:bg-gray-200"
                        }
                      >
                        <td className="px-4 py-3 border-b border-gray-700">
                          {domainObj.name}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-700">
                          {devNames.join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3 border-b border-gray-700">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              isSubmitted
                                ? "bg-green-500/20 text-green-600"
                                : "bg-yellow-500/20 text-yellow-600"
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

          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            {/* Platform / Domain */}
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Platform
                </label>
              
                <input
      type="text"
      value={
        submission.domain ||
        (taskDetails?.domains
          ? taskDetails.domains.map((d: any) => d.name).join(", ")
          : "")
      }
      readOnly
      placeholder="Domain"
      className="w-full rounded-lg border border-gray-200 bg-gray-100 p-3 text-gray-800 dark:border-gray-700 dark:bg-white/[0.05] dark:text-white/90 cursor-not-allowed"
    />
              </div>
            </div>

            {/* Country & Feasible For */}
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country
                </label>
                <CreatableSelect
                  isMulti
                  options={allCountries}
                  name="country"
                  value={submission.country.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                  onChange={(selected) =>
                    setSubmission({
                      ...submission,
                      country: selected ? selected.map((c) => c.value) : [],
                    })
                  }
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: "#ffffff", // White background
                      borderColor: state.isFocused ? "#3B82F6" : "#D1D5DB", // blue-500 when focused, gray-300 default
                      boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
                      color: "#111827", // gray-900 text
                      "&:hover": { borderColor: "#3B82F6" },
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#ffffff", // White dropdown
                      color: "#111827",
                      border: "1px solid #E5E7EB", // gray-200 border
                      borderRadius: "0.375rem",
                      zIndex: 20,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#3B82F6" // blue-500 for selected
                        : state.isFocused
                        ? "#EFF6FF" // blue-50 for hover
                        : "#ffffff",
                      color: state.isSelected ? "#ffffff" : "#111827",
                      cursor: "pointer",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#E0F2FE", // blue-100 tag background
                      color: "#1E3A8A", // blue-900 text
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#1E3A8A", // blue-900 text
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      color: "#1E3A8A",
                      ":hover": {
                        backgroundColor: "#BFDBFE", // blue-200
                        color: "#1E3A8A",
                      },
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: "#6B7280", // gray-500
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#111827",
                    }),
                  }}
                  placeholder="Search or select countries..."
                />

                {errors.country && (
                  <p className="text-red-400 text-sm mt-1">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Approx Volume & Method */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  Approx Volume
                </label>
                <input
                  type="text"
                  value={submission.approxVolume}
                  name="approxVolume"
                  onChange={handleChange}
                  placeholder="e.g. 45000 or 4M or N/A"
                  className="w-full rounded-lg border border-gray-600  p-3 text-gray-800 "
                />
                <p className="text-xs text-gray-400 mt-1">
                  Start with digits or enter 'N/A'
                </p>
                {errors.approxVolume && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.approxVolume}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  Method
                </label>
                <select
                  value={submission.method}
                  name="method"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600  p-3  "
                >
                  <option value="" hidden>
                    Select Method
                  </option>
                  <option value="Browser Automation">Browser Automation</option>
                  <option value="Request">Request</option>
                  <option value="Semi Automation">Semi Automation</option>
                </select>
              </div>
            </div>

            {/* Login & Proxy */}
            <div className="flex gap-6 flex-wrap">
              <label className="flex items-center gap-2 text-gray-700 ">
                <input
                  type="checkbox"
                  checked={submission.userLogin}
                  onChange={handleChange}
                  name="userLogin"
                />
                Login Required?
              </label>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={submission.proxyUsed}
                  onChange={handleChange}
                  name="proxyUsed"
                />
                Proxy Used?
              </label>
            </div>

            {/* Conditional Login Fields */}
            {submission.userLogin && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ">
                    Login Type
                  </label>
                  <select
                    value={submission.loginType}
                    onChange={handleChange}
                    name="loginType"
                    className="w-full rounded-lg border border-gray-600 p-3  "
                  >
                    <option value="" hidden>
                      Select Login Type
                    </option>
                    <option value="Free">Free Login</option>
                    <option value="Purchased login">Purchased Login</option>
                  </select>
                  {errors.loginType && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.loginType}
                    </p>
                  )}
                </div>
                {submission.userLogin &&
                  submission.loginType === "Purchased login" && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Credentials
                      </label>
                      <textarea
                        value={submission.credentials}
                        onChange={(e) =>
                          setSubmission({
                            ...submission,
                            credentials: e.target.value,
                          })
                        }
                        placeholder="Enter Credentials here..."
                        name="credentials"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800 dark:border-gray-700 dark:bg-white/[0.05] dark:text-white/90 h-32"
                      />
                    </div>
                  )}
              </div>
            )}

            {/* Conditional Proxy Fields */}
            {submission.proxyUsed && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ">
                    Proxy Name
                  </label>
                  <input
                    value={submission.proxyName}
                    onChange={handleChange}
                    name="proxyName"
                    placeholder="Enter Proxy Name"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800  "
                  />
                  {errors.proxyName && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.proxyName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ">
                    Per Request Credit
                  </label>
                  <input
                    type="number"
                    name="perRequestCredit"
                    value={submission.perRequestCredit}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800  "
                  />
                  {errors.perRequestCredit && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.perRequestCredit}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 ">
                    Total Requests
                  </label>
                  <input
                    type="number"
                    value={submission.totalRequest}
                    name="totalRequest"
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800"
                  />
                  {errors.totalRequest && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.totalRequest}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Last Checked Date & Complexity */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  Last Checked Date
                </label>
                <DatePicker
                  selected={new Date(submission.lastCheckedDate)}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setSubmission({
                        ...submission,
                        lastCheckedDate: format(date, "yyyy-MM-dd"),
                      });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  maxDate={new Date()}
                  name="lastCheckedDate"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800"
                />
                {errors.lastCheckedDate && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.lastCheckedDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  Complexity
                </label>
                <select
                  name="complexity"
                  value={submission.complexity}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-600 p-3"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                </select>
                {errors.complexity && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.complexity}
                  </p>
                )}
              </div>
            </div>

            {/* GitHub & Output */}
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 ">
                  GitHub Repo Link
                </label>
                <input
                  type="text"
                  name="githubLink"
                  value={submission.githubLink}
                  placeholder="Enter GitHub link"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800 "
                />
                {errors.githubLink && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.githubLink}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* File Upload */}
                <div className="flex-1">
                  <label className=" mb-2 font-medium">
                    Attach Output Document{" "}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="file"
                    name="files"
                    onChange={handleChange}
                    multiple
                    placeholder="Choose output file(s)"
                    className="w-full p-3 rounded-md  border border-gray-600 text-gray-600
                 focus:outline-none focus:ring-2 focus:ring-blue-500
                 file:mr-4 file:py-2 file:px-4 file:rounded-md
                 file:border-0 file:text-sm file:font-semibold
                 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  {errors.sowUrl && (
                    <p className="text-red-400 text-sm mt-1">{errors.sowUrl}</p>
                  )}
                </div>

                {/* OR separator */}
                <div className="flex-shrink-0 text-gray-400 font-semibold mx-2">
                  OR
                </div>

                {/* URL Input */}
                <div className="flex-1">
                  <label className="mb-2 font-medium ">
                    Output Document URL
                  </label>
                  <input
                    type="text"
                    name="sowUrl"
                    value={submission.sowUrl || ""}
                    onChange={handleChange}
                    placeholder="Enter Output Document URL"
                    className="w-full p-3 rounded-md  border border-gray-600 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 h-15"
                  />
                </div>
              </div>
            </div>

            {/* Remark */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700 ">
                Remark
              </label>
              <textarea
                value={submission.remark}
                placeholder="Enter Remark here..."
                name="remark"
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setSubmission({ ...submission, remark: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800 h-32"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 flex-wrap">
              <button
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition"
              >
                Submit Task
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full md:w-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-semibold transition"
              >
                ⬅️ Back
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default SubmitTaskUI;
