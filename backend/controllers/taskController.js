import Task from "../models/Task.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { jwtDecode } from "jwt-decode";

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

// Normalize status for comparison
function normalizeStatus(status) {
  // Lowercase and trim only; DO NOT remove special chars used for status uniqueness
  return status.toLowerCase().trim();
}


/* ------------------ Controllers ------------------ */

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const raw = req.body || {};
    const developers = encodeDevelopers(raw.developers);

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
      sowFile: req.files?.sowFile?.[0] ? `uploads/${req.files.sowFile[0].filename}` : undefined,
      inputFile: req.files?.inputFile?.[0] ? `uploads/${req.files.inputFile[0].filename}` : undefined
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
// UPDATE TASK
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Basic field updates
    const fields = [
      "title",
      "assignedBy",
      "assignedTo",
      "description",
      "taskAssignedDate",
      "targetDate",
      "completeDate",
      "complexity",
      "status",
      "typeOfDelivery",
      "typeOfPlatform",
    ];
    fields.forEach((f) => {
      if (body[f] !== undefined) task[f] = body[f];
    });

    /* ---------- 🧩 Developer & Domain Handling ---------- */
    if (body.developers) {
      const devObj =
        typeof body.developers === "string"
          ? JSON.parse(body.developers)
          : body.developers;

      if (Array.isArray(task.domains)) {
        // 🧩 Track all developers assigned across domains
        const assignedDevelopers = new Set();

        task.domains = task.domains.map((domain) => {
          const devsForDomain = devObj[domain.name] || [];

          // ✅ Filter valid ObjectIds and prevent duplicates
          const uniqueDevs = [];
          for (const dev of devsForDomain) {
            const devId = typeof dev === "object" ? dev._id : dev;
            if (mongoose.Types.ObjectId.isValid(devId) && !assignedDevelopers.has(String(devId))) {
              uniqueDevs.push(devId);
              assignedDevelopers.add(String(devId));
            }
          }

          const updatedStatus =
            uniqueDevs.length > 0 ? "in-progress" : "pending";

          return {
            ...domain,
            developers: uniqueDevs,
            status: updatedStatus,
          };
        });

      }

      // If any domain has developers → mark task as in-progress
      const hasAnyDev = Object.values(devObj).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      );
      if (hasAnyDev) {
        task.status = "in-progress";
      }
    }

    /* ---------- 📎 File Handling ---------- */
    ["sowFile", "inputFile", "outputFile"].forEach((f) => {
      if (req.files?.[f]?.[0]) task[f] = `uploads/${req.files[f][0].filename}`;
    });

    await task.save();

    const taskObj = task.toObject();
    taskObj.submissions = decodeSubmissions(taskObj.submissions || {});

    res.json(taskObj);
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Server error while updating task" });
  }
};



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

    const files = req.files?.files?.map(f => `uploads/${f.filename}`) || [];

    const submissionData = {
      platform: body.platform,
      typeOfDelivery: normalizeEnum(body.typeOfDelivery, ["api", "data as a service"]),
      typeOfPlatform: normalizeEnum(body.typeOfPlatform, ["web", "app", "both"]),
      complexity: normalizeEnum(body.complexity, ["Low", "Medium", "High", "Very High"]),
      userLogin: body.userLogin === true || body.userLogin === "true",
      proxyUsed: body.proxyUsed === true || body.proxyUsed === "true",
      country: body.country,
      feasibleFor: body.feasibleFor,
      approxVolume: body.approxVolume,
      method: body.method,
      proxyName: body.proxyName,
      perRequestCredit: body.perRequestCredit,
      totalRequest: body.totalRequest,
      lastCheckedDate: body.lastCheckedDate,
      githubLink: body.githubLink,
      files,
      outputUrl: body.outputUrl || null,
      loginType: body.loginType,
      credentials: body.credentials,
      submittedAt: new Date(),
      // Ensure status is 'submitted' by default if not provided, for completion logic
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
      } catch {}
    }

    /* ---------------- Match before lookups ---------------- */
    const match = {};
    if (role === "Developer" && userId) {
      match["domains.developers"] = mongoose.Types.ObjectId(userId);
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
          createdAt: 1,
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
        },
      },

      { $sort: { createdAt: -1 } },

      /* ------------- Pagination ------------- */
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
        },
      },
    ]);

    const tasksData = tasksAggregate[0]?.data || [];
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
    const { taskId, domainName, status ,reason} = req.body;
     const file = req.file;

    if (!taskId || !domainName || !status) {
      return res.status(400).json({ message: "taskId, domainId, and status are required" });
    }

    console.log("domainId",domainName);
    

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


