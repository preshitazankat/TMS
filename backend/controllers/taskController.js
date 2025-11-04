import Task from "../models/Task.js";
import User from "../models/User.js";
import { sendSlackMessage } from "../utils/sendSlackMessage.js";
import mongoose from "mongoose";
import { jwtDecode } from "jwt-decode";
import fs from "fs";
import path from "path";

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

    const assignedUser = await User.findById(assignedByUserId).lean();
    const slackTag = assignedUser?.slackId ? `<@${assignedUser.slackId}>` : assignedUser?.email;


    const slackMessage = `
🆕 *New Task Created*
*Project Code:* ${projectCode}
*Task:* ${raw.taskName}
*Domains:* ${(domain || []).join(", ")}
*Description:* ${raw.description || "N/A"}
*Assigned to:* ${slackTag}
*Target Date:* ${targetDate.toLocaleDateString()}
`;


    await sendSlackMessage(process.env.sales - rd - channel - test, slackMessage);

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
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);

    //console.log("req.body", req.body);

    const urlFields = ["sowUrls", "inputUrls", "outputUrls", "clientSampleSchemaUrls"];

    // Parse stringified arrays (from FormData)
    urlFields.forEach((field) => {
      if (body[field] !== undefined) body[field] = safeParseArray(body[field]);
    });

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // ✅ Handle simple URL updates
    for (const field of urlFields) {
      if (Array.isArray(body[field])) task[field] = body[field].filter(Boolean);
    }

    // ✅ Handle general file uploads (non-domain)
    const genericFileKeys = ["sowFile", "inputFile", "clientSampleSchemaFile"];
    for (const key of genericFileKeys) {
      if (req.files?.[key]?.length) {
        const fieldName =
          key === "sowFile"
            ? "sowFiles"
            : key === "inputFile"
              ? "inputFiles"
              : "clientSampleSchemaFiles";

        const uploadedPaths = req.files[key].map((f) => `uploads/${f.filename}`);
        task[fieldName] = [...(task[fieldName] || []), ...uploadedPaths];
        task.markModified(fieldName);
      }
    }

    // ----------------------------------------------------------------------
    // ✅ Domain-wise outputFiles upload (Add new paths to in-memory task object)
    // ----------------------------------------------------------------------
    // 💡 FIX 1: Initialize tracking variables
    const newlyUploadedPaths = new Set();
    const newUploadsMap = new Map(); // Store new uploads by domain name for later merge

    if (req.files?.outputFiles?.length) {
      const uploadedPaths = req.files.outputFiles.map((f) => `uploads/${f.filename}`);
      const domainsForEachFile = Array.isArray(req.body.outputFileDomains)
        ? req.body.outputFileDomains
        : [req.body.outputFileDomains];

      uploadedPaths.forEach((filePath, i) => {
        const domainName = domainsForEachFile[i];
        const domain = task.domains.find((d) => d.name === domainName);
        if (!domain) return;
        if (!domain.submission) domain.submission = {};

        // 1. Add to task object (in memory)
        const existing = domain.submission.outputFiles || [];
        const unique = [...new Set([...existing, filePath])];
        domain.submission.outputFiles = unique;

        // 2. Add to global tracker for deletion block
        newlyUploadedPaths.add(filePath);
        if (!newUploadsMap.has(domainName)) newUploadsMap.set(domainName, []);
        newUploadsMap.get(domainName).push(filePath);
      });

      task.markModified("domains");
    }

    // ----------------------------------------------------------------------
    // 🗑️ Handle deleted outputFiles (cleanly)
    // ----------------------------------------------------------------------
    if (body.keptOutputFiles) {
      try {
        const keptOutputFiles =
          typeof body.keptOutputFiles === "string"
            ? JSON.parse(body.keptOutputFiles)
            : body.keptOutputFiles;

        // 💡 The newlyUploadedPaths map is now correctly populated from the previous block.

        for (const [domainName, keptFiles] of Object.entries(keptOutputFiles)) {
          const domain = task.domains.find((d) => d.name === domainName);
          if (!domain || !domain.submission) continue;

          const currentFiles = domain.submission.outputFiles || [];

          // 1. Find files to remove
          // 💡 FIX 2: Prevent deletion of newly uploaded files
          const removed = currentFiles.filter((f) =>
            !keptFiles.includes(f) && !newlyUploadedPaths.has(f)
          );

          removed.forEach((filePath) => {
            try {
              // Using path.resolve(filePath) should correctly handle paths like 'uploads/filename.ext'
              const absPath = path.resolve(filePath);
              if (fs.existsSync(absPath)) {
                fs.unlinkSync(absPath);
                console.log("🗑️ Deleted:", absPath);
              }
            } catch (err) {
              console.warn("⚠️ Failed to delete:", filePath, err.message);
            }
          });

          // 2. 💡 CRITICAL FIX 3: Update the task object with the merged list: Kept (old) files + New uploads
          const newUploadsForDomain = newUploadsMap.get(domainName) || [];
          // Merge kept files (from frontend) with the new files (from req.files)
          const finalFiles = Array.from(new Set([...keptFiles, ...newUploadsForDomain]));

          domain.submission.outputFiles = finalFiles;
        }

        task.markModified("domains");
      } catch (err) {
        console.error("❌ keptOutputFiles parse error:", err);
      }
    }



    // ✅ Handle domain output URLs
    if (req.body.domainOutputUrls) {
      let outputUrlsData = req.body.domainOutputUrls;

      if (Array.isArray(outputUrlsData)) {
        const merged = {};
        outputUrlsData.forEach((item) => {
          if (typeof item === "string" && item.trim() && item !== "[]") {
            try { Object.assign(merged, JSON.parse(item)); } catch { }
          }
        });
        outputUrlsData = merged;
      } else if (typeof outputUrlsData === "string") {
        try { outputUrlsData = JSON.parse(outputUrlsData); } catch { outputUrlsData = {}; }
      }

      // ✅ Set/Update URLs
      for (const [domainName, urls] of Object.entries(outputUrlsData)) {
        const domain = task.domains.find((d) => d.name === domainName);
        if (!domain) continue;
        if (!domain.submission) domain.submission = {};

        if (Array.isArray(urls)) {
          domain.submission.outputUrls = urls.length ? urls : [];
        } else if (urls) {
          domain.submission.outputUrls = [urls];
        } else {
          domain.submission.outputUrls = [];
        }
      }

      // ✅ Clear URLs for domains NOT sent from frontend
      task.domains.forEach((d) => {
        if (!outputUrlsData[d.name]) {
          d.submission.outputUrls = [];
        }
      });

      task.markModified("domains");
    }

    // ✅ File deletions for non-domain files
    for (const field of ["sowFiles", "inputFiles", "clientSampleSchemaFiles"]) {
      const possibleKeys = [field + "Kept", field.replace("Files", "File") + "Kept"];
      const keptKey = possibleKeys.find((k) => body[k] !== undefined);
      const keptFilesArr = keptKey ? safeParseArray(body[keptKey]) : [];
      const keptFiles = new Set(keptFilesArr); // Set of old, kept files

      // 1. Identify newly uploaded files BEFORE calculating what was removed
      const uploadKey =
        field === "clientSampleSchemaFiles"
          ? "clientSampleSchemaFile"
          : field.replace("Files", "File");

      // Get the array of paths for the files just uploaded in this request
      const newUploads =
        req.files?.[uploadKey]?.map((f) => `uploads/${f.filename}`) || [];
      const newUploadsSet = new Set(newUploads); // Set of new file paths

      // 2. Filter files for removal

      const removedFiles = (task[field] || []).filter((f) => {
        // Only consider files that are NOT newly uploaded for deletion
        if (newUploadsSet.has(f)) return false;

        // A file is "removed" if it's an old file path and the frontend didn't send it back (i.e., not in keptFiles).
        return !keptFiles.has(f);
      });

      // 3. Perform Deletion
      for (const f of removedFiles) {
        try {
          const abs = path.resolve(f);
          if (fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch (err) {
          console.warn("⚠️ Failed to delete:", f, err.message);
        }
      }

      // 4. Merge kept files with new uploads for the final DB save
      const merged = Array.from(new Set([...keptFilesArr, ...newUploads]));
      task[field] = merged;
      task.markModified(field);
    }


    // ✅ Update other basic fields

    const fieldsToUpdate = [
      "title",
      "assignedBy",
      "assignedTo",
      "description",
      "sampleFileRequired",
      "requiredValumeOfSampleFile",
      "complexity",
      "status",
      "typeOfDelivery",
      "typeOfPlatform",
    ];

    fieldsToUpdate.forEach((f) => {
      if (body[f] !== undefined) {
        if (f === "sampleFileRequired") task[f] = body[f] === "true";
        else if (f === "requiredValumeOfSampleFile") task[f] = Number(body[f]);
        else task[f] = body[f];
      }
    });

    if (body.typeOfDelivery)
      task.typeOfDelivery = body.typeOfDelivery.toLowerCase();
    if (body.typeOfPlatform)
      task.typeOfPlatform = body.typeOfPlatform.toLowerCase();


    let incomingDomains = [];
    if (body.domains) {
      try {
        // Parse incoming domains (from a stringified array/JSON if sent via FormData)
        incomingDomains =
          typeof body.domains === "string" ? JSON.parse(body.domains) : body.domains;
      } catch (e) {
        console.error("Failed to parse incoming domains:", e);
      }
    }

    // Create a map of existing domains for quick lookup
    const existingDomainsMap = new Map(
      task.domains.map((d) => [d.name, d])
    );

    const finalDomains = [];

    incomingDomains.forEach((incomingDomain) => {
      const existingDomain = existingDomainsMap.get(incomingDomain.name);

      if (existingDomain) {
        // 1. Existing Domain: Preserve the existing Mongoose subdocument.
        // This object already contains the outputUrl update made earlier.
        finalDomains.push(existingDomain);
      } else {
        // 2. New Domain: Create a new structure.
        finalDomains.push({
          name: incomingDomain.name,
          status: "pending",
          developers: [],
          // Use array [] for outputUrl and outputFiles for a clean start
          submission: { outputFiles: [], outputUrls: [] },
        });
      }
    });

    // Update the task's domains array with the merged list
    task.domains = finalDomains;

    // Mongoose Subdocuments are automatically marked modified when pushed/updated, 
    // but reassigning the parent array requires marking the array itself.
    task.markModified("domains");


    // ✅ Handle developers assignment per domain
    if (body.developers) {
      const devObj =
        typeof body.developers === "string"
          ? JSON.parse(body.developers)
          : body.developers;

      const assignedDevelopers = new Set();

      // 💡 FIX: Use forEach to mutate the existing Mongoose subdocument in place.
      for (const domain of task.domains) {
        const devsForDomain = devObj[domain.name] || [];
        const uniqueDevs = [];

        for (const dev of devsForDomain) {
          const devId = typeof dev === "object" ? dev._id : dev;
          if (
            mongoose.Types.ObjectId.isValid(devId) &&
            !assignedDevelopers.has(String(devId))
          ) {
            uniqueDevs.push(devId);
            assignedDevelopers.add(String(devId));
          }
        }

        // Mutate the existing object properties (outputUrl is safe)
        domain.developers = uniqueDevs;
        domain.status =
          domain.status === "submitted"
            ? "submitted"
            : uniqueDevs.length > 0
              ? "in-progress"
              : "pending";
      }

      // Since we modified nested properties, mark the parent array as modified.
      task.markModified("domains");


      const hasAnyDev = Object.values(devObj).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );
      if (hasAnyDev) task.status = "in-progress";
    }

    // ✅ Save task
    await task.save();
    try {

      const assignedDevs = [];
      updateTask.domains.forEach((d) => {
        if (Array.isArray(d.developers) && d.developers.length > 0) {
          assignedDevs.push(...d.developers);
        }
      });

      if (assignedDevs.length > 0) {
        // Unique devs
        const uniqueDevs = Array.from(
          new Map(assignedDevs.map((d) => [d._id, d])).values()
        );

        // Tag devs
        const slackMentions = uniqueDevs
          .map((u) => (u.slackId ? `<@${u.slackId}>` : u.email))
          .join(", ");

        const domainNames = updateTask.domains.map((d) => d.name).join(", ");

        const slackMessage = `
🆕 *Developers Assigned to Task*
*Task:* ${updateTask.title || updateTask.projectCode}
*Domains:* ${domainNames}
*Assigned Developers:* ${slackMentions}
🔗 Task ID: ${updateTask._id}
    `;

        await sendSlackMessage(process.env.rd - developer - channel - test, slackMessage);
      }
    } catch (err) {
      console.error("⚠️ Slack Notification Error:", err.message);
    }

    res.json({ message: "✅ Task updated successfully", task });
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Server error while updating task" });
  }
};

// SUBMIT TASK
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;

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
    const newOutputFiles = req.files?.outputFiles?.map(f => `uploads/${f.filename}`) || [];

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
      credentials: getScalar(body.credentials),
      status: body.status ? String(body.status).toLowerCase() : "submitted",
      remark: getScalar(body.remark || "")
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
    //     try {
    //   // fetch assigner & submitter user info
    //   const assigner = await User.findById(task.assignedBy).lean();

    //   // submitted dev id = first developer on that domain OR assignedTo fallback
    //   let submittedDevId;
    //   if (task.domains?.length) {
    //     for (const d of task.domains) {
    //       if (domains.includes(d.name) && d.developers?.length) {
    //         submittedDevId = d.developers[0];
    //         break;
    //       }
    //     }
    //   }
    //   if (!submittedDevId) submittedDevId = task.assignedTo;

    //   const dev = await User.findById(submittedDevId).lean();

    //   const submittedDomains = domains
    //     .map(d => typeof d === "object" ? d.name : d)
    //     .join(", ");

    //   const slackMsg = `✅ *Task Submitted*\n*Task:* ${task.title || task.projectCode}\n*Domains:* ${submittedDomains}\n*Submitted by:* <@${dev?.slackId || ''}>`;

    //   // ✅ DM assigner
    //   if (assigner?.slackId) {
    //     await sendSlackMessage(assigner.slackId, slackMsg);
    //   }

    //   // ✅ Send to 2 channels
    //   await sendSlackMessage(process.env.sales-rd-channel-test, slackMsg);
    //   await sendSlackMessage(process.env.rd-developer-channel-test, slackMsg);

    // } catch (err) {
    //   console.error("⚠️ Slack notify error:", err.message);
    // }
    // Assuming these helper functions exist to decode the fields before sending
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.json(obj);

  } catch (err) { console.error("SubmitTask Error:", err); res.status(500).json({ error: err.message || "Server error" }); }
};

// const updateDelayedDomainsDebug = async () => {
//   const now = new Date();
//   console.log("⏳ Checking delayed domains at:", now);

//   const tasks = await Task.find({});

//   for (const task of tasks) {
//     console.log("\n🔍 Task:", task.projectCode, "| Target:", task.targetDate);

//     let updated = false;

//     task.domains = task.domains.map((domain) => {
//       console.log(
//         ` → Domain: ${domain.name} | Status: ${domain.status} | Target: ${task.targetDate}`
//       );

//       // Skip allowed statuses
//       if (["submitted", "in-R&D", "delayed"].includes(domain.status)) {
//         console.log("   ✅ Allowed status, no change.");
//         return domain;
//       }

//       // Check if overdue
//       if (task.targetDate < now && domain.status !== "delayed") {
//         console.log("   ⚠️ OVERDUE! Changing to delayed");
//         updated = true;
//         return { ...domain, status: "delayed" };
//       }

//       console.log("   ➡️ Not overdue yet, no change.");
//       return domain;
//     });

//     if (updated) {
//       task.markModified("domains");
//       await task.save();
//       console.log("💾 Saved update for", task.projectCode);
//     } else {
//       console.log("❎ No change for", task.projectCode);
//     }
//   }
// };

// get all tasks


// Get All Tasks
export const getTask = async (req, res) => {
  try {

    //await updateDelayedDomainsDebug();
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
    const match = {};
    const now = new Date();

    await Task.updateMany(
      {
        targetDate: { $lt: now }, // target date passed
        "domains.status": { $in: ["pending", "in-progress"] }, // match both
      },
      {
        $set: {
          "domains.$[elem].status": "delayed",
        },
      },
      {
        arrayFilters: [
          { "elem.status": { $in: ["pending", "in-progress"] } } // filter both
        ],
      }
    );

    /* ---------------- Match before lookups ---------------- */

    if (role === "Developer" && userId) {
      match["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      match["domains.status"] = { $regex: new RegExp(`^${status}$`, "i") };
    }





    const tasksAggregate = await Task.aggregate([
      { $match: match }, // initial match (by role, etc.)

      // Lookups for assignedBy, assignedTo
      { $lookup: { from: "users", localField: "assignedBy", foreignField: "_id", as: "assignedBy" } },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "assignedTo", foreignField: "_id", as: "assignedTo" } },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // 🔹 Unwind domains so each domain is a separate row
      { $unwind: { path: "$domains", preserveNullAndEmptyArrays: true } },
      ...(status // <--- This block correctly filters *after* domains are unwound
        ? [
          {
            $match: {
              "domains.status": { $regex: new RegExp(`^${status}$`, "i") },
            },
          },
        ]
        : []),


      // 🔹 Lookup developers for this domain
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },

      // 🔹 NOW apply status filter per domain
      // ...(status
      //   ? [
      //     {
      //       $match: {
      //         "domains.status": { $regex: new RegExp(`^${status}$`, "i") },
      //       },
      //     },
      //   ]
      //   : []),

      // 🔹 Search filter (title, domain name, etc.)
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

      // 🔹 Final projection: show domain-level info clearly
      {
        $project: {
          _id: 1,
          projectCode: 1,
          title: 1,
          description: 1,
          taskAssignedDate: 1,
          assignedBy: { $ifNull: ["$assignedBy.name", "-"] },
          assignedTo: { $ifNull: ["$assignedTo.name", "-"] },
          domainName: "$domains.name",
          domainStatus: "$domains.status", // ✅ domain status
          domainDevelopers: {
            $map: {
              input: "$domainDevelopers",
              as: "dev",
              in: "$$dev.name",
            },
          },
          completeDate: { $ifNull: ["$domains.completeDate", "$completeDate"] },
          createdAt: 1,
          targetDate: 1,
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



    let tasksData = tasksAggregate[0]?.data || [];
    //tasksData = applyDelayedStatus(tasksData);

    const total = tasksAggregate[0]?.metadata[0]?.total || 0;

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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid task ID" });
    }

    const task = await Task.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },

      // Join Assigned By User
      {
        $lookup: {
          from: "users",
          localField: "assignedBy",
          foreignField: "_id",
          as: "assignedBy",
        },
      },
      { $unwind: { path: "$assignedBy", preserveNullAndEmptyArrays: true } },

      // Join Assigned To User
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      { $unwind: { path: "$assignedTo", preserveNullAndEmptyArrays: true } },

      // Join Domain Developers
      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "domainDevelopers",
        },
      },

      {
        $addFields: {
          domains: {
            $map: {
              input: "$domains",
              as: "dom",
              in: {
                $mergeObjects: [
                  "$$dom",
                  {
                    developers: {
                      $filter: {
                        input: "$domainDevelopers",
                        as: "dev",
                        cond: { $in: ["$$dev._id", "$$dom.developers"] },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },

      { $project: { domainDevelopers: 0 } },
    ]);

    if (!task.length) return res.status(404).json({ message: "Task not found" });

    const obj = task[0];
    obj.assignedBy = obj.assignedBy?.name || "-";
    obj.assignedTo = obj.assignedTo?.name || "-";

    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});

    res.json(obj);

  } catch (err) {
    console.error("GetSingleTask Error:", err);
    res.status(500).json({ message: "Failed to fetch task" });
  }
};

// GET DOMAIN STATS PER DOMAIN NAME
export const getDomainStats = async (req, res) => {
  try {
    // 🔐 Token validation
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    let userId, role;
    try {
      const decoded = jwtDecode(token);
      userId = decoded?.id;
      role = decoded?.role;
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // 🎯 Match condition (restrict Developer to their own domains)
    const matchStage = {};
    if (role === "Developer") {
      matchStage["domains.developers"] = new mongoose.Types.ObjectId(userId);
    }

    // ⚡ MongoDB aggregation for fast domain-level stats
    const stats = await Task.aggregate([
      { $unwind: "$domains" },
      ...(role === "Developer" ? [{ $match: matchStage }] : []),

      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$domains.status", "pending"] }, 1, 0] },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-progress"] }, 1, 0] },
          },
          delayed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "delayed"] }, 1, 0] },
          },
          inRAndD: {
            $sum: { $cond: [{ $eq: ["$domains.status", "in-R&D"] }, 1, 0] },
          },
          submitted: {
            $sum: { $cond: [{ $eq: ["$domains.status", "submitted"] }, 1, 0] },
          },
          deployed: {
            $sum: { $cond: [{ $eq: ["$domains.status", "deployed"] }, 1, 0] },
          },
        },
      },

      {
        $project: {
          _id: 0,
          total: 1,
          pending: 1,
          "in-progress": "$inProgress",
          delayed: 1,
          "in-R&D": "$inRAndD",
          submitted: 1,
          deployed: 1,
        },
      },
    ]);

    // 🧾 Response (return 0s if no data)
    const result = stats[0] || {
      total: 0,
      pending: 0,
      "in-progress": 0,
      delayed: 0,
      "in-R&D": 0,
      submitted: 0,
      deployed: 0,
    };

    res.status(200).json({
      success: true,
      message: "Domain stats fetched successfully",
      data: result,
    });
  } catch (err) {
    console.error("DomainStats Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch domain stats",
      error: err.message,
    });
  }
};

// GET DEVELOPERS DOMAIN STATUS
export const getDevelopersDomainStatus = async (req, res) => {
  try {
    const stats = await Task.aggregate([
      { $unwind: "$domains" }, // each domain becomes a row
      { $unwind: "$domains.developers" }, // each developer in domain becomes a row

      {
        $lookup: {
          from: "users",
          localField: "domains.developers",
          foreignField: "_id",
          as: "dev",
        },
      },
      { $unwind: "$dev" }, // get developer details

      {
        $group: {
          _id: {
            devId: "$dev._id",
            devName: "$dev.name",
          },
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [
                { $in: [{ $toLower: "$domains.status" }, ["submitted", "completed"]] },
                1, 0
              ]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "in-progress"] }, 1, 0]
            }
          },
          inRD: {
            $sum: {
              $cond: [{ $in: [{ $toLower: "$domains.status" }, ["in-r&d", "in-rd"]] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "pending"] }, 1, 0]
            }
          },
          delayed: {
            $sum: {
              $cond: [{ $eq: [{ $toLower: "$domains.status" }, "delayed"] }, 1, 0]
            }
          },
        }
      },

      {
        $project: {
          _id: 0,
          devId: "$_id.devId",
          name: "$_id.devName",
          total: 1,
          completed: 1,
          inProgress: 1,
          inRD: 1,
          pending: 1,
          delayed: 1,
        }
      }
    ]);

    res.json(stats);
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
    if (reason) domain.reason = reason;

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
