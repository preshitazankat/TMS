import Task from "../models/Task.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { jwtDecode } from "jwt-decode";
import fs from "fs";

/* ------------------ Helpers ------------------ */

const encodeKey = (key) => typeof key === "string" ? key.replace(/\./g, "‧") : key;
const decodeKey = (key) => typeof key === "string" ? key.replace(/‧/g, ".") : key;

const encodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (typeof devs === "string") {
    try { devs = JSON.parse(devs); } catch { }
  }
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries = devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) out[encodeKey(k)] = v;
  return out;
};

const decodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries = devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) out[decodeKey(k)] = v;
  return out;
};

const decodeSubmissions = (subs) => {
  if (!subs) return subs;
  const out = {};
  if (subs instanceof Map) {
    for (const [k, v] of subs.entries()) out[decodeKey(k)] = v;
  } else if (typeof subs === "object" && !Array.isArray(subs)) {
    for (const k of Object.keys(subs)) out[decodeKey(k)] = subs[k];
  }
  return out;
};

const cleanBody = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const cleaned = {};
  for (const key of Object.keys(body)) {
    const value = body[key];
    if (value === undefined) continue;
    cleaned[key] = value === "" || value === "null" || value === "undefined" ? null : value;
  }
  return cleaned;
};

const normalizeEnum = (value, allowedValues, defaultValue) => {
  if (!value) return defaultValue;
  const formatted = String(value).trim().toLowerCase();
  const match = allowedValues.find(v => v.toLowerCase() === formatted);
  return match || defaultValue;
};

const applyDelayedStatus = (task) => {
  const now = new Date();
  if (task.status !== "submitted" && task.status !== "in-R&D" && task.targetDate && new Date(task.targetDate) < now) {
    task.status = "delayed";
  }
  return task;
};

const updateDelayedDomains = async (task) => {
  const now = new Date();
  let updated = false;

  if (task.domains && Array.isArray(task.domains)) {
    task.domains.forEach(domain => {
      if (
        domain.status !== "submitted" &&
        domain.status !== "in-R&D" &&
        domain.status !== "delayed" &&
        task.targetDate && new Date(task.targetDate) < now
      ) {
        domain.status = "delayed";
        updated = true;
      }
    });
  }

  if (updated) await task.save();
  return task;
};

export const computeTaskOverallStatus = (task) => {
  if (!task.domains || !task.domains.length) return task.status;
  let hasRD = false, hasDelay = false;
  for (const d of task.domains) {
    if (d.status === "in-R&D") hasRD = true;
    else if (d.status === "delayed") hasDelay = true;
  }
  if (hasRD) return "in-R&D";
  if (hasDelay) return "delayed";
  return task.status;
};

function normalizeStatus(status) {
  // Lowercase and trim only; DO NOT remove special chars used for status uniqueness
  return status.toLowerCase().trim();
}

const safeParseArray = (value) => {
  if (!value) return [];

  let parsedArray = [];

  // 1. If it's already an array, use it.
  if (Array.isArray(value)) {
    parsedArray = value;
  }
  // 2. If it's a string, try to JSON parse it.
  else if (typeof value === "string") {
    try {
      // Attempt to parse it as a JSON array (e.g., '["url1", "url2"]')
      const jsonParsed = JSON.parse(value);
      if (Array.isArray(jsonParsed)) {
        parsedArray = jsonParsed;
      } else {
        // If parsing didn't result in an array, treat the original string as a single item.
        parsedArray = [value];
      }
    } catch (e) {
      // If JSON parsing failed, treat the original string as a single item.
      parsedArray = [value];
    }
  }

  // 3. Flatten and clean the resulting array:
  //    - Filter out non-strings.
  //    - Trim whitespace.
  //    - Filter out empty strings.
  //    - Ensure uniqueness (using Set).
  const cleaned = Array.from(new Set(
    parsedArray
      .filter(item => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item !== "")
  ));

  return cleaned;
};


/* ------------------ Controllers ------------------ */

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const raw = req.body || {};
    const developers = encodeDevelopers(raw.developers);

    /* ------------------ Helpers ------------------ */

    let assignedByUserId;

    // Check common places where middleware stores the user's ID/object
    if (req.user && req.user._id) {
      assignedByUserId = req.user._id;
    } else if (req.userId) {
      assignedByUserId = req.userId;
    }
    // Fallback: Check if the decoded token object was attached directly to req
    else if (req.user && req.user.id) {
      assignedByUserId = req.user.id;
    }


    if (!assignedByUserId) {
      // This means the user is not authenticated or the session is invalid
      return res.status(401).json({ error: "Unauthorized: User session is invalid or missing." });
    }


    let sowUrls = safeParseArray(raw.sowUrls);
    let inputUrls = safeParseArray(raw.inputUrls);
    let clientSampleSchemaUrls = safeParseArray(raw.clientSampleSchemaUrls);

    let domain = raw.domain;
    if (typeof domain === "string") {
      try { domain = JSON.parse(domain); } catch { }
    }

    const lastTask = await Task.findOne().sort({ createdAt: -1 }).lean();
    let nextNum = 1;
    if (lastTask?.projectCode) {
      const parts = lastTask.projectCode.split("-");
      const lastNum = parseInt(parts[1]);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const projectCode = `RD-${String(nextNum).padStart(3, "0")}`;
    const assignedDate = new Date();
    const targetDate = new Date();
    targetDate.setDate(assignedDate.getDate() + 2);

    const taskData = {
      ...raw,

      projectCode,
      developers,
      domains: domain ? (Array.isArray(domain) ? domain : [domain]).map(d => ({ name: d })) : [],
      taskAssignedDate: assignedDate,
      targetDate,
      sowFiles:
        req.files?.sowFile?.map((f) => `uploads/${f.filename}`) || [],
      inputFiles:
        req.files?.inputFile?.map((f) => `uploads/${f.filename}`) || [],
      clientSampleSchemaFiles:
        req.files?.clientSampleSchemaFiles?.map((f) => `uploads/${f.filename}`) || [],
      sowUrls: sowUrls,
      inputUrls: inputUrls,
      clientSampleSchemaUrls: clientSampleSchemaUrls,
      assignedBy: assignedByUserId,
    };

    const task = new Task(taskData);
    await task.save();

    const obj = task.toObject();
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.status(201).json(obj);

  } catch (err) {
    console.error("CreateTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// UPDATE TASK
// export const updateTask = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const body = cleanBody(req.body);

//     const urlFields = ["sowUrls", "inputUrls", "outputUrls", "clientSampleSchemaUrls"];

//     // Apply safeParseArray to convert the JSON string arrays (from FormData) 
//     // back into JavaScript arrays in the body object.
//     urlFields.forEach(field => {
//       if (body[field] !== undefined) {
//         body[field] = safeParseArray(body[field]);
//       }
//     });

//     const task = await Task.findById(id);
//     if (!task) return res.status(404).json({ error: "Task not found" });

//     // ---------- 1️⃣ Update basic fields ----------
//     const fields = [
//       "title",
//       "assignedBy",
//       "assignedTo",
//       "description",
//       "taskAssignedDate",
//       "targetDate",
//       "completeDate",
//       "complexity",
//       "status",
//       "typeOfDelivery",
//       "typeOfPlatform",
//       "sowUrls",
//       "inputUrls",
//       "outputUrls",
//       "clientSampleSchemaUrls",
//     ];

//     const urlFieldsToMark = new Set([
//       "sowUrls",
//       "inputUrls",
//       "outputUrls",
//       "clientSampleSchemaUrls",
//     ]);

//     fields.forEach((f) => {
//       if (body[f] !== undefined) {
//         if (urlFieldsToMark.has(f)) {
//           const existing = Array.isArray(task[f]) ? task[f] : [];
//           const incoming = Array.isArray(body[f]) ? body[f] : [];
//           task[f] = Array.from(new Set([...existing, ...incoming].filter(Boolean)));
//           task.markModified(f);
//         } else {
//           task[f] = body[f];
//         }
//       }
//     });



//     // Normalize delivery/platform to lowercase
//     if (body.typeOfDelivery) task.typeOfDelivery = body.typeOfDelivery.toLowerCase();
//     if (body.typeOfPlatform) task.typeOfPlatform = body.typeOfPlatform.toLowerCase();

//     // ---------- 2️⃣ Merge domains ----------
//     let incomingDomains = [];
//     if (body.domains) {
//       incomingDomains =
//         typeof body.domains === "string" ? JSON.parse(body.domains) : body.domains;
//     }

//     const existingDomainNames = task.domains.map((d) => d.name);
//     incomingDomains.forEach((d) => {
//       if (!existingDomainNames.includes(d.name)) {
//         task.domains.push({
//           name: d.name,
//           status: "pending",
//           developers: [],
//           submission: { files: [], outputUrl: "" },
//         });
//       }
//     });

//     // ---------- 3️⃣ Assign developers ----------
//     if (body.developers) {
//       const devObj =
//         typeof body.developers === "string" ? JSON.parse(body.developers) : body.developers;

//       const assignedDevelopers = new Set();

//       task.domains = task.domains.map((domain) => {
//         const devsForDomain = devObj[domain.name] || [];
//         const uniqueDevs = [];

//         for (const dev of devsForDomain) {
//           const devId = typeof dev === "object" ? dev._id : dev;
//           if (mongoose.Types.ObjectId.isValid(devId) && !assignedDevelopers.has(String(devId))) {
//             uniqueDevs.push(devId);
//             assignedDevelopers.add(String(devId));
//           }
//         }

//         return {
//           ...domain.toObject(),
//           developers: uniqueDevs,
//           status:
//             domain.status === "submitted" // if already submitted, keep it
//               ? "submitted"
//               : uniqueDevs.length > 0
//                 ? "in-progress"
//                 : "pending",
//         };
//       });

//       // Update task status if any developer is assigned
//       const hasAnyDev = Object.values(devObj).some(
//         (arr) => Array.isArray(arr) && arr.length > 0
//       );
//       if (hasAnyDev) task.status = "in-progress";
//     }

//     // ---------- 4️⃣ Handle file uploads ----------
//     ["sowFile", "inputFile", "outputFile", "clientSampleSchemaFiles"].forEach((key) => {
//       if (req.files?.[key]?.length) {
//         const fieldName =
//           key === "sowFile"
//             ? "sowFiles"
//             : key === "inputFile"
//               ? "inputFiles"
//               : key === "outputFile"
//                 ? "outputFiles"
//                 : "clientSampleSchemaFiles"; // 👈 new field added

//         console.log("Files received:", req.files);

//         // taskController.js (Original/Current logic for files)

//         // ...
//         const filePaths = req.files[key].map((f) => `uploads/${f.filename}`);
//         // Append new uploads to existing array
//         task[fieldName] = [...(task[fieldName] || []), ...filePaths]; // THIS IS THE PROBLEM
//         // ...
//       }
//     });


//     // ---------- 5️⃣ Save task ----------
//     await task.save();

//     const taskObj = task.toObject();
//     taskObj.submissions = decodeSubmissions(taskObj.submissions || {});

//     res.json(taskObj);
//   } catch (err) {
//     console.error("UpdateTask Error:", err);
//     res.status(500).json({ error: err.message || "Server error while updating task" });
//   }
// };

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);
    console.log("🧩 Multer received files:", Object.keys(req.files || {}));


    const urlFields = ["sowUrls", "inputUrls", "outputUrls", "clientSampleSchemaUrls"];
    const fileFields = ["sowFiles", "inputFiles", "outputFiles", "clientSampleSchemaFiles"];

    // Parse incoming stringified arrays (from FormData)
    urlFields.forEach((field) => {
      if (body[field] !== undefined) {
        body[field] = safeParseArray(body[field]);
      }
    });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // ---------- Handle URL Updates ----------
    for (const field of urlFields) {
      if (Array.isArray(body[field])) {
        // Only keep what’s currently sent from frontend
        task[field] = body[field].filter(Boolean);
      }
    }

    // ---------- Handle File Uploads ----------
    for (const key of ["sowFile", "inputFile", "outputFiles", "clientSampleSchemaFiles"]) {
      if (req.files?.[key]?.length) {
        console.log("📂 Files received in updateTask:", Object.keys(req.files));
        const fieldName =
          key === "sowFile"
            ? "sowFiles"
            : key === "inputFile"
              ? "inputFiles"
              : key === "outputFiles"
                ? "outputFiles"
                : "clientSampleSchemaFiles";

                if (req.files?.outputFiles?.length) {
  const uploadedPaths = req.files.outputFiles.map((f) => `uploads/${f.filename}`);

  if (task.domains && Array.isArray(task.domains)) {
    task.domains.forEach((domain) => {
      if (!domain.submission) domain.submission = {};
      if (!Array.isArray(domain.submission.outputFiles)) domain.submission.outputFiles = [];
      domain.submission.outputFiles.push(...uploadedPaths);
    });
  }
}

        const uploadedPaths = req.files[key].map((f) => `uploads/${f.filename}`);

        // Merge with existing files
        task[fieldName] = [...(task[fieldName] || []), ...uploadedPaths];
      }
    }

    // ---------- Handle File Deletions ----------
    for (const field of fileFields) {
      if (body[field] !== undefined && Array.isArray(body[field])) {
        // Only keep what the frontend sent
        const keptFiles = new Set(body[field]);
        const removedFiles = (task[field] || []).filter((f) => !keptFiles.has(f));

        // Delete removed files from disk
        for (const f of removedFiles) {
          try {
            fs.unlinkSync(f);
          } catch (err) {
            console.warn("⚠️ Failed to delete file:", f, err.message);
          }
        }

        // Update DB field
        task[field] = Array.from(keptFiles);
      }
    }

    // ---------- Update Other Fields ----------
    const fieldsToUpdate = [
      "title",
      "assignedBy",
      "assignedTo",
      "description",
      "sampleFileRequired",
      "requiredValumeOfSampleFile",
      //"taskAssignedDate",
      // "targetDate",
       //"completeDate",
       "sowFiles",
      "inputFiles",
      "outputFiles",
      "outputUrls",
      "clientSampleSchemaFiles",
      "complexity",
      "status",
      "typeOfDelivery",
      "typeOfPlatform",
    ];

    fieldsToUpdate.forEach((f) => {
      if (body[f] !== undefined) task[f] = body[f];
    });

    // Normalize Delivery/Platform
    if (body.typeOfDelivery)
      task.typeOfDelivery = body.typeOfDelivery.toLowerCase();
    if (body.typeOfPlatform)
      task.typeOfPlatform = body.typeOfPlatform.toLowerCase();

    //     // ---------- 2️⃣ Merge domains ----------
    let incomingDomains = [];
    if (body.domains) {
      incomingDomains =
        typeof body.domains === "string" ? JSON.parse(body.domains) : body.domains;
    }

    const existingDomainNames = task.domains.map((d) => d.name);
    incomingDomains.forEach((d) => {
      if (!existingDomainNames.includes(d.name)) {
        task.domains.push({
          name: d.name,
          status: "pending",
          developers: [],
          submission: { files: [], outputUrl: "" },
        });
      }
    });

    // ---------- 3️⃣ Assign developers ----------
    if (body.developers) {
      const devObj =
        typeof body.developers === "string" ? JSON.parse(body.developers) : body.developers;

      const assignedDevelopers = new Set();

      task.domains = task.domains.map((domain) => {
        const devsForDomain = devObj[domain.name] || [];
        const uniqueDevs = [];

        for (const dev of devsForDomain) {
          const devId = typeof dev === "object" ? dev._id : dev;
          if (mongoose.Types.ObjectId.isValid(devId) && !assignedDevelopers.has(String(devId))) {
            uniqueDevs.push(devId);
            assignedDevelopers.add(String(devId));
          }
        }

        return {
          ...domain.toObject(),
          developers: uniqueDevs,
          status:
            domain.status === "submitted" // if already submitted, keep it
              ? "submitted"
              : uniqueDevs.length > 0
                ? "in-progress"
                : "pending",
        };
      });

      // Update task status if any developer is assigned
      const hasAnyDev = Object.values(devObj).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );
      if (hasAnyDev) task.status = "in-progress";
    }

    await task.save();
    res.json({ message: "✅ Task updated successfully", task });
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res.status(500).json({ error: err.message || "Server error while updating task" });
  }
};


// SUBMIT TASK
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    // NOTE: Assuming cleanBody, normalizeEnum, decodeDevelopers, decodeSubmissions are defined elsewhere
    const body = cleanBody(req.body);
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Safely parse domains from body, ensuring it's an array
    let domains = [];
    if (body.domain) {
      try {
        // Try parsing as JSON
        domains = typeof body.domain === "string" ? JSON.parse(body.domain) : body.domain;
        if (!Array.isArray(domains)) domains = [domains]; // wrap single value into array
      } catch {
        // If JSON.parse fails, treat it as a single string
        domains = [body.domain];
      }
    }

    if (!Array.isArray(domains)) domains = [domains];

    //const outputFiles = req.files?.outputFiles?.map(f => `uploads/${f.filename}`) || [];
    const newOutputFiles = req.files?.outputFile?.map(f => `uploads/${f.filename}`) || [];

    // 🔥 FIX: 2. Store the new file paths into the main task document
    if (newOutputFiles.length > 0) {
      task.outputFiles = [...(task.outputFiles || []), ...newOutputFiles];
    }

    if (body.outputUrls) {
      // Assuming outputUrls from the body is the final array of URLs
      task.outputUrls = typeof body.outputUrls === 'string' ? JSON.parse(body.outputUrls) : body.outputUrls;
    }

    // Use the *updated* array from the task object for submissionData
    const submissionOutputFiles = task.outputFiles || [];
    const submissionOutputUrls = task.outputUrls || [];

    const getScalar = (v) => (Array.isArray(v) ? v[0] : v);
    const getArray = (v) => {
  if (v === undefined || v === null) return [];
  
  // 1. If it's already an array, flatten it and process elements
  if (Array.isArray(v)) {
    let result = [];
    v.forEach(item => {
      // Recursively process array items to handle nested arrays/strings
      result = result.concat(getArray(item));
    });
    // Remove duplicates
    return [...new Set(result.filter(Boolean))];
  }

  // 2. If it's a string, first attempt JSON parsing (for array strings from FormData)
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      // If parsing yields an array, recursively process it
      if (Array.isArray(parsed)) {
          return getArray(parsed);
      }
    } catch (e) {
      // JSON parsing failed, assume it's a simple string.
    }

    // 3. Check for comma-separated values (the root cause of "Afghanistan,Anguilla")
    // This splits the string only if it contains a comma.
    if (v.includes(',')) {
      // Split by comma, trim whitespace from each part, and filter out empty strings
      return v.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    // 4. Otherwise, return the single string value wrapped in an array
    return [v];
  }
  
  // 5. Default: return single non-array, non-string value in an array
  return [v];
};

    const submissionData = {
      platform: body.platform,
      typeOfDelivery: normalizeEnum(body.typeOfDelivery, ["api", "data as a service", "both(api & data as a service)"]),
      typeOfPlatform: normalizeEnum(body.typeOfPlatform, ["web", "app", "both (app & web)"]),
      complexity: normalizeEnum(body.complexity, ["Low", "Medium", "High", "Very High"]),
      userLogin: body.userLogin === true || body.userLogin === "true",
      proxyUsed: body.proxyUsed === true || body.proxyUsed === "true",
      country: getArray(body.country),
      feasibleFor: getScalar(body.feasibleFor),
      approxVolume: getScalar(body.approxVolume),
      method: getScalar(body.method),
      userLogin: getScalar(body.userLogin),
      loginType: getScalar(body.loginType),
      complexity: getScalar(body.complexity),
      //typeOfDelivery: getScalar(body.typeOfDelivery),
      //typeOfPlatform: getScalar(body.typeOfPlatform),
      apiName: getScalar(body.apiName),
      proxyUsed: getScalar(body.proxyUsed),
      proxyName: getScalar(body.proxyName),
      perRequestCredit: Number(getScalar(body.perRequestCredit)),
      totalRequest: Number(getScalar(body.totalRequest)),
      lastCheckedDate: getScalar(body.lastCheckedDate),
      githubLink: getScalar(body.githubLink),
      outputFiles: submissionOutputFiles,
      outputUrls: submissionOutputUrls,
      loginType: getScalar(body.loginType),
      credentials: body.credentials,


      status: body.status ? String(body.status).toLowerCase() : "submitted",
      remarks: body.remarks || ""
    };

    if (!task.submissions || typeof task.submissions !== "object") task.submissions = {};

    // Helper to set submission data on the task's submission map
    const setSubmission = (key, data) => {
      if (task.submissions instanceof Map) task.submissions.set(key, data);
      else task.submissions[key] = data;
    };

    let allDomainsSubmitted = false;

    // 1. Save submission data keyed by domain name (or directly to task if no domains)
    if (domains.length > 0) {
      domains.forEach(d => {
        const key = typeof d === "object" ? d.name : d;
        setSubmission(key, submissionData);
      });
    } else {
      // For tasks without explicit domains, apply submission data directly
      Object.assign(task, submissionData);
      setSubmission("default", submissionData); // Also save to map for completeness
    }

    // 2. FIX: Update domain statuses in the task.domains array and check overall status
    if (task.domains && Array.isArray(task.domains) && task.domains.length > 0) {
      // Update the status of the submitted domain(s)
      domains.forEach(d => {
        const domainName = typeof d === "object" ? d.name : d;
        const domainIndex = task.domains.findIndex(td => td.name === domainName);
        if (domainIndex !== -1) {
          task.domains[domainIndex].status = submissionData.status;
          task.domains[domainIndex].completeDate = new Date();
          task.domains[domainIndex].submission = submissionData; // Save submission details on the domain object
        }
      });

      // Check if ALL domains are now submitted
      allDomainsSubmitted = task.domains.every(d => d.status === "submitted");

    } else {
      // If no domains were defined, the single submission determines the overall status
      allDomainsSubmitted = submissionData.status === "submitted";
    }

    // 3. Update the overall task status based on domain status check
    if (allDomainsSubmitted) {
      task.status = "submitted";
      task.completeDate = new Date();
    } else {
      // If at least one submission was made, but not all domains are complete, 
      // ensure the overall status moves from 'pending' to 'in-progress'.
      if (submissionData.status === "submitted" && task.status === "pending") {
        task.status = "in-progress";
      }
      // If it was already "in-progress", it remains "in-progress"
    }

    await task.save();
    const obj = task.toObject();
    // Assuming these helper functions exist to decode the fields before sending
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.json(obj);

  } catch (err) { console.error("SubmitTask Error:", err); res.status(500).json({ error: err.message || "Server error" }); }
};

// get all tasks
export const getTask = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const token = req.headers.authorization?.split(" ")[1];
    let userId, role;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded?.id;
        role = decoded?.role;
      } catch { }
    }

    /* ---------------- Match before lookups ---------------- */
    const match = {};
    if (role === "Developer" && userId) {
      match["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      match["domains.status"] = { $regex: new RegExp(`^${status}$`, "i") };
    }

    const tasksAggregate = await Task.aggregate([
      { $match: match },

      /* ------------- Lookup assignedBy user ------------- */
      {
        $lookup: {
          from: "users",
          localField: "assignedBy",
          foreignField: "_id",
          as: "assignedBy",
        },
      },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },

      /* ------------- Lookup assignedTo user ------------- */
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      /* ------------- Unwind domains ------------- */
      { $unwind: { path: "$domains", preserveNullAndEmptyArrays: true } },

      /* ------------- Lookup developers ------------- */
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },

      /* ------------- Second $match (for search) ------------- */
      ...(search.trim()
        ? [
          {
            $match: {
              $or: [
                { projectCode: { $regex: search, $options: "i" } },
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { "domains.name": { $regex: search, $options: "i" } },
                { "assignedBy.name": { $regex: search, $options: "i" } },
                { "assignedTo.name": { $regex: search, $options: "i" } },
                { "domainDevelopers.name": { $regex: search, $options: "i" } },
              ],
            },
          },
        ]
        : []),

      /* ------------- Project flattened fields ------------- */
      {
        $project: {
          _id: 1,
          title: 1,
          projectCode: 1,
          description: 1,
          taskAssignedDate: 1,
          completeDate: {
            $ifNull: ["$domains.completeDate", "$completeDate"],
          },
          domainName: { $ifNull: ["$domains.name", "-"] },
          domainStatus: { $ifNull: ["$domains.status", "pending"] },
          assignedBy: { $ifNull: ["$assignedBy.name", "-"] },
          assignedTo: { $ifNull: ["$assignedTo.name", "-"] },
          domainDevelopers: {
            $map: {
              input: "$domainDevelopers",
              as: "dev",
              in: { $ifNull: ["$$dev.name", "Unknown"] },
            },
          },
          createdAt: 1,
        },
      },

      { $sort: { createdAt: -1 } },


      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ]);

    const tasksData = tasksAggregate[0]?.data || [];
    const total = tasksAggregate[0]?.metadata[0]?.total || 0;
    console.log("dioshicojs", tasksData)
    res.json({
      tasks: tasksData,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("GetTask Aggregation Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// GET SINGLE TASK
export const getSingleTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("assignedBy", "name role").
      populate("assignedTo", "name role").populate("domains.developers", "name role");;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    if (!task) return res.status(404).json({ message: "Task not found" });
    const obj = task.toObject();
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    obj.assignedBy = obj.assignedBy?.name || "-";
    obj.assignedTo = obj.assignedTo?.name || "-";
    res.json(obj);
  } catch (err) { console.error("GetSingleTask Error:", err); res.status(500).json({ message: "Failed to fetch task" }); }
};

// GET DOMAIN STATS PER DOMAIN NAME
export const getDomainStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let userId, role;
    try {
      const decoded = jwtDecode(token)
      userId = decoded.id;
      role = decoded.role;
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const tasks = await Task.find({}).lean();
    const domainStats = {};

    tasks.forEach(task => {
      (task.domains || []).forEach(domain => {
        // ✅ If role is Developer, only count domains assigned to them
        if (role === "Developer") {
          const devIds = (domain.developers || []).map(dev => (dev?._id ? String(dev._id) : String(dev)));
          if (!devIds.includes(userId)) return;
        }

        const name = domain.name || "unknown";
        if (!domainStats[name]) {
          domainStats[name] = {
            total: 0,
            pending: 0,
            "in-progress": 0,
            delayed: 0,
            "in-R&D": 0,
            submitted: 0,
          };
        }

        domainStats[name].total += 1;

        const status = domain.status || "pending";
        switch (status) {
          case "pending":
            domainStats[name].pending += 1;
            break;
          case "in-progress":
            domainStats[name]["in-progress"] += 1;
            break;
          case "delayed":
            domainStats[name].delayed += 1;
            break;
          case "in-R&D":
            domainStats[name]["in-R&D"] += 1;
            break;
          case "submitted":
            domainStats[name].submitted += 1;
            break;
        }
      });
    });

    res.json(domainStats);
  } catch (err) {
    console.error("DomainStats Error:", err);
    res.status(500).json({ message: "Failed to fetch domain stats" });
  }
};

// GET DEVELOPERS DOMAIN STATUS
export const getDevelopersDomainStatus = async (req, res) => {
  try {
    // Fetch all tasks and populate the developer names
    const tasks = await Task.find({})
      .populate("domains.developers", "name") // populate only name
      .lean();

    const stats = {};

    tasks.forEach(task => {
      (task.domains || []).forEach(domain => {
        (domain.developers || []).forEach(dev => {
          if (!dev) return; // skip if developer reference is null

          const id = String(dev._id);
          const name = dev.name || "Unknown";

          // Initialize stats object for developer
          if (!stats[id]) {
            stats[id] = {
              name,
              total: 0,
              completed: 0,
              inProgress: 0,
              inRD: 0,
              pending: 0,
              delayed: 0,
            };
          }

          stats[id].total += 1;

          // Normalize status
          const status = (domain.status || "pending").toLowerCase();

          if (status === "submitted" || status === "completed") stats[id].completed += 1;
          else if (status === "in-progress") stats[id].inProgress += 1;
          else if (status === "in-r&d" || status === "in-rd") stats[id].inRD += 1;
          else if (status === "pending") stats[id].pending += 1;
          else if (status === "delayed") stats[id].delayed += 1;
        });
      });
    });

    // Convert object to array for easier use in frontend
    const result = Object.values(stats);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching developer domain stats:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// UPDATE DOMAIN STATUS
export const updateTaskDomainStatus = async (req, res) => {
  try {
    const { taskId, domainName, status, reason } = req.body;
    const file = req.file;

    if (!taskId || !domainName || !status) {
      return res.status(400).json({ message: "taskId, domainId, and status are required" });
    }

    console.log("domainId", domainName);


    // Find the task by its ID
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Find the domain inside the domains array
    const domain = task.domains?.find(d => d.name === domainName); // using Mongoose subdocument id method
    if (!domain) return res.status(404).json({ message: "Domain not found" });

    // Update status
    domain.status = status;
    if (reason) domain.remarks = reason;

    if (req.file) {
      domain.upload = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
      };
    }


    // Optional: update domain's completeDate if submitted
    if (status === "submitted") {
      domain.completeDate = new Date();
      if (domain.submission) domain.submission.status = status;
    }

    await task.save();

    res.json({ message: "Domain status updated", domain });

  } catch (err) {
    console.error("updateTaskDomainStatus Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};


