// taskController.js
import Task from "../models/Task.js";
import User from "../models/User.js";
import {jwtDecode} from "jwt-decode";

/* ------------------ Helpers (defensive) ------------------ */

// encode '.' in keys to avoid mongoose Map '.' restrictions
// at the top of taskController.js
const encodeKey = (key) =>
  typeof key === "string" ? key.replace(/\./g, "‧") : key;

const decodeKey = (key) =>
  typeof key === "string" ? key.replace(/‧/g, ".") : key;

const encodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (typeof devs === "string") {
    try { devs = JSON.parse(devs); } catch { }
  }
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries =
    devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) {
    out[encodeKey(k)] = v;
  }
  return out;
};

const decodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (Array.isArray(devs)) return devs;
  const out = {};
  const entries =
    devs instanceof Map ? Array.from(devs.entries()) : Object.entries(devs);
  for (const [k, v] of entries) {
    out[decodeKey(k)] = v;
  }
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

// Clean simple body values
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
  const match = allowedValues.find((v) => v.toLowerCase() === formatted);
  return match || defaultValue;
};

const validateTaskInput = (data) => {
  const errors = {};
  if (!data.title || data.title.trim() === "") errors.title = "Title is required";
  if (!data.assignedBy || data.assignedBy.trim() === "") errors.assignedBy = "Assigned By is required";
  if (!data.assignedTo || data.assignedTo.trim() === "") errors.assignedTo = "Assigned To is required";
  //if (!data.priority) errors.priority = "Priority is required";
  if (!data.taskAssignedDate) errors.taskAssignedDate = "Assigned Date is required";
  if (!data.targetDate) errors.targetDate = "Target Date is required";
  else if (new Date(data.targetDate) < new Date(data.taskAssignedDate))
    errors.targetDate = "Target Date must be after Assigned Date";
  return errors;
};

// helper: update delayed status
const applyDelayedStatus = (task) => {
  if (
    task.status !== "submitted" &&
    task.targetDate &&
    new Date(task.targetDate) < new Date()
  ) {
    task.status = "delayed";
  }
  return task;
};


/* ------------------ Controllers ------------------ */

// CREATE
export const createTask = async (req, res) => {
  try {
    const raw = req.body || {};
    const errors = validateTaskInput(raw);
    if (Object.keys(errors).length) return res.status(400).json({ errors });

    //const priority = normalizeEnum(raw.priority, ["High", "Medium", "Low"], "Medium");
    const complexity = normalizeEnum(raw.complexity, ["Low", "Medium", "High", "Very High"], undefined);
    const typeOfDelivery = normalizeEnum(raw.typeOfDelivery, ["api", "data as a service"], undefined);
    const typeOfPlatform = normalizeEnum(raw.typeOfPlatform, ["web", "app", "both"], undefined);

    const developers = encodeDevelopers(raw.developers);
    let domain = raw.domain;
    if (typeof domain === "string") {
      try { domain = JSON.parse(domain); } catch { }
    }

    const lastTask = await Task.findOne().sort({ createdAt: -1 }).lean();
    let nextNum = 1;
    if (lastTask && lastTask.projectCode) {
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
      //priority,
      complexity,
      typeOfDelivery,
      typeOfPlatform,
      developers,
      domain,
      sowFile: req.files?.sowFile?.[0] ? `uploads/${req.files.sowFile[0].filename}` : undefined,
      inputFile: req.files?.inputFile?.[0] ? `uploads/${req.files.inputFile[0].filename}` : undefined,
      sowUrl: raw.sowUrl || undefined,
      inputUrl: raw.inputUrl || undefined,

      taskAssignedDate: assignedDate,
      targetDate: targetDate
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

// UPDATE
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);

    // const priority = body.priority
    //   ? normalizeEnum(body.priority, ["High", "Medium", "Low",], "Medium")
    //   : undefined;
    const typeOfDelivery = body.typeOfDelivery
      ? normalizeEnum(body.typeOfDelivery, ["api", "data as aservice"], undefined)
      : undefined;
    const typeOfPlatform = body.typeOfPlatform
      ? normalizeEnum(body.typeOfPlatform, ["web", "app", "both"], undefined)
      : undefined;
    // parse developers
    let developers;
    if (body.developers) {
      try {
        developers = typeof body.developers === "string"
          ? JSON.parse(body.developers)
          : body.developers;
      } catch { developers = {}; }
      if (developers && typeof developers === "object" && !Array.isArray(developers)) {
        developers = encodeDevelopers(developers);
      }
    }

    // parse domain
    let domain = body.domain;
    if (domain && typeof domain === "string") {
      try { domain = JSON.parse(domain); } catch { domain = [domain]; }
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // update normal fields
    if (body.title !== undefined) task.title = body.title;
    if (body.assignedBy !== undefined) task.assignedBy = body.assignedBy;
    if (body.assignedTo !== undefined) task.assignedTo = body.assignedTo;
    if (body.description !== undefined) task.description = body.description;
    if (body.taskAssignedDate !== undefined) task.taskAssignedDate = body.taskAssignedDate;
    if (body.targetDate !== undefined) task.targetDate = body.targetDate;
    if (body.completeDate !== undefined) task.completeDate = body.completeDate;
    // if (priority !== undefined) task.priority = priority;
    if (typeOfDelivery !== undefined) task.typeOfDelivery = typeOfDelivery;
    if (typeOfPlatform !== undefined) task.typeOfPlatform = typeOfPlatform;
    if (body.complexity !== undefined) task.complexity = body.complexity;
    if (body.status !== undefined) task.status = body.status.toLowerCase();
    if (body.sempleFile !== undefined) task.sempleFile = body.sempleFile;
    if (domain !== undefined) task.domain = domain;

    // ⬇️ detect developer changes
    if (developers !== undefined) {
      const oldDevelopersJSON = JSON.stringify(task.developers || {});
      const newDevelopersJSON = JSON.stringify(developers);
      task.developers = developers;

      // if different → force status in-progress
      if (oldDevelopersJSON !== newDevelopersJSON) {
        task.status = "in-progress";
      }
    }

    if (req.files?.sowFile?.[0]) task.sowFile = `uploads/${req.files.sowFile[0].filename}`;
    if (req.files?.inputFile?.[0]) task.inputFile = `uploads/${req.files.inputFile[0].filename}`;
    if (req.files?.outputFile?.[0]) task.outputFile = `uploads/${req.files.outputFile[0].filename}`; // ✅
    if (body.sowUrl !== undefined) task.sowUrl = body.sowUrl;
    if (body.inputUrl !== undefined) task.inputUrl = body.inputUrl;
    if (body.outputUrl !== undefined) task.outputUrl = body.outputUrl; // ✅

    await task.save();

    const taskObj = task.toObject();
    taskObj.developers = decodeDevelopers(taskObj.developers || {});
    taskObj.submissions = decodeSubmissions(taskObj.submissions || {});
    res.json(taskObj);
  } catch (err) {
    console.error("UpdateTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};

// SUBMIT (domain-specific)
export const submitTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};


    // booleans
    body.userLogin = body.userLogin === "true" || body.userLogin === true;
    body.proxyUsed = body.proxyUsed === "true" || body.proxyUsed === true;

    // domain (normalize - we take first if array)
    let domain = body.domain;
    if (typeof domain === "string") {
      try {
        const parsed = JSON.parse(domain);
        domain = Array.isArray(parsed) ? parsed[0] : parsed;
      } catch { }
    } else if (Array.isArray(domain)) {
      domain = domain[0];
    }

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // ---- FILES handling ----
    console.log("Files received:", req.files);

    const files = req.files.files[0].filename
      ? `uploads/${req.files.files[0].filename}`
      : null;


    // allow frontend to optionally pass status (e.g. "completed")
    const incomingStatus = body.status
      ? String(body.status).toLowerCase()
      : "submitted";

    const submissionData = {
      platform: body.platform,
      userLogin: body.userLogin,
      country: body.country,
      feasibleFor: body.feasibleFor,
      approxVolume: body.approxVolume,
      method: body.method,
      proxyUsed: body.proxyUsed,
      proxyName: body.proxyName,
      perRequestCredit: body.perRequestCredit,
      totalRequest: body.totalRequest,
      lastCheckedDate: body.lastCheckedDate,
      complexity: body.complexity,
      githubLink: body.githubLink,
      files: files,
      outputUrl: body.outputUrl || null, // ✅ also store url
      loginType: body.loginType,
      credentials: body.credentials,
      submittedAt: new Date(),
      status: incomingStatus,
      remarks: body.remarks || "",
    };

    if (!task.submissions || typeof task.submissions !== "object")
      task.submissions = {};

    // helper to set/get from submissions (supports Map or plain object)
    const setSubmissionForKey = (safeKey, data) => {
      if (task.submissions instanceof Map) {
        task.submissions.set(safeKey, data);
      } else {
        task.submissions[safeKey] = data;
      }
    };

    if (domain) {
      const safe = domain.replace(/\./g, "‧");
      setSubmissionForKey(safe, submissionData);
    } else {
      // legacy / root-level submission fields
      Object.assign(task, submissionData);
    }

    // recompute task status
    // if frontend sends status explicitly -> respect that
    // recompute task status only if frontend didn't explicitly set one
    if (body.status) {
      task.status = String(body.status).toLowerCase();
    } else {
      // decode both developers and submissions for correct comparison
      const devKeys = Object.keys(decodeDevelopers(task.developers || {}));
      const subsDecoded = decodeSubmissions(task.submissions || {});

      if (devKeys.length > 0) {
        const allSubmitted = devKeys.every((key) => {
          const sub = subsDecoded[key];
          return sub && sub.status === "submitted";
        });

        if (allSubmitted) {
          task.status = "submitted";
          if (!task.completeDate) {
            task.completeDate = new Date(); // set once
          }
        } else {
          task.status = "in-progress";
          task.completeDate = null; // optional: reset if not all submitted
        }
      } else {
        task.status = "in-progress";
        task.completeDate = null;
      }
    }


    await task.save();

    const obj = task.toObject();
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.json(obj);
  } catch (err) {
    console.error("SubmitTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};




export const getTask = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    // search filter
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { projectCode: searchRegex },
        { title: searchRegex },
        { assignedTo: searchRegex },
        { assignedBy: searchRegex },
        { domain: { $elemMatch: { $regex: searchRegex } } },
      ];
    }

    if (status) query.status = status.toLowerCase();

    let token = req.headers.authorization?.split(" ")[1];
let userId;
let role;
if (token) {
  const decoded = jwtDecode(token);
  userId = decoded?.id;
  role = decoded?.role;
}



//    if (role === "Developer" && userId) {
//   query.$or = [
//     { assignedTo: userId }, // matches ObjectId
//     { [`developers.${userId}`]: { $exists: true } } // keep if developers is stored as map
//   ];
// }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // fetch tasks
    let tasksRaw = await Task.find(query)
  .populate("assignedBy", "name role")
  .populate("assignedTo", "name role")
  .sort({ _id: -1 })
  .skip(skip)
  .limit(parseInt(limit))
  .lean();

if (role === "Developer" && userId) {
  tasksRaw = tasksRaw.filter(task => {
    // assignedTo can be populated object or string
    const assignedToId =
      typeof task.assignedTo === "string"
        ? task.assignedTo
        : task.assignedTo?._id?.toString();

    const assignedToMatches = assignedToId === userId;

    const developersMatches = Object.values(task.developers || {}).some(
      devs => devs.map(String).includes(userId) // ensure strings
    );

    return assignedToMatches || developersMatches;
  });
}
    const totalCount = await Task.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // populate developers map with names
    for (const task of tasksRaw) {
      const devMap = decodeDevelopers(task.developers || {});
      for (const domain of Object.keys(devMap)) {
        const devIds = devMap[domain] || [];
        if (devIds.length) {
          const users = await User.find({ _id: { $in: devIds } }).select("name");
          devMap[domain] = users.map(u => u.name);
        } else {
          devMap[domain] = [];
        }
      }
      task.developers = devMap;

      // decode submissions if needed
      task.submissions = decodeSubmissions(task.submissions || {});
      task.status = applyDelayedStatus(task).status;

      // convert assignedBy/assignedTo to name strings
      task.assignedBy = task.assignedBy?.name || task.assignedBy || "-";
      task.assignedTo = task.assignedTo?.name || task.assignedTo || "-";
    }

    res.json({ tasks: tasksRaw, totalCount, totalPages, currentPage: parseInt(page) });
  } catch (err) {
    console.error("GetTasks Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};


// STATS

export const getStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    let userId;
    let role;

    if (token) {
      const decoded = jwtDecode(token);
      userId = decoded?.id;
      role = decoded?.role;
    }

    let allTasks = await Task.find({}).lean();

    if (role === "Developer" && userId) {
      allTasks = allTasks.filter(task => {
        const assignedToMatches = task.assignedTo?.toString() === userId;
        const developerInDomains = Object.values(task.developers || {}).some(devs =>
          devs.map(d => d.toString()).includes(userId)
        );
        return assignedToMatches || developerInDomains;
      });
    }

    const total = allTasks.length;
    const pending = allTasks.filter(t => t.status === "pending").length;
    const inProgress = allTasks.filter(t => t.status === "in-progress").length;
    const delayed = allTasks.filter(t => t.status === "delayed").length;
    const completed = allTasks.filter(t => t.status === "submitted").length;

    console.log("Developer task total:", total);

    res.json({ total, completed, pending, delayed, inProgress });
  } catch (err) {
    console.error("GetStats Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};



// GET SINGLE
export const getSingleTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate("assignedBy", "name")
      .populate("assignedTo", "name")
      .lean();

    if (!task) return res.status(404).json({ error: "Task not found" });

    // decode developers map with names
    const devMap = decodeDevelopers(task.developers || {});
    for (const domain of Object.keys(devMap)) {
      const devIds = devMap[domain] || [];
      if (devIds.length) {
        const users = await User.find({ _id: { $in: devIds } }).select("name");
        devMap[domain] = users.map(u => u.name);
      } else {
        devMap[domain] = [];
      }
    }
    task.developers = devMap;

    // decode submissions
    task.submissions = decodeSubmissions(task.submissions || {});

    // status with delayed logic
    task.status = applyDelayedStatus(task).status;

    // assignedBy / assignedTo names
    task.assignedBy = task.assignedBy?.name || task.assignedBy || "-";
    task.assignedTo = task.assignedTo?.name || task.assignedTo || "-";

    res.json(task);
  } catch (err) {
    console.error("GetSingleTask Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
};


