import Task from "../models/Task.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import {jwtDecode} from "jwt-decode";

/* ------------------ Helpers ------------------ */

const encodeKey = (key) => typeof key === "string" ? key.replace(/\./g, "‧") : key;
const decodeKey = (key) => typeof key === "string" ? key.replace(/‧/g, ".") : key;

const encodeDevelopers = (devs) => {
  if (!devs) return devs;
  if (typeof devs === "string") {
    try { devs = JSON.parse(devs); } catch {}
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

/* ------------------ Controllers ------------------ */

// CREATE TASK
export const createTask = async (req, res) => {
  try {
    const raw = req.body || {};
    const developers = encodeDevelopers(raw.developers);

    let domain = raw.domain;
    if (typeof domain === "string") {
      try { domain = JSON.parse(domain); } catch {}
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
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const body = cleanBody(req.body);

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const fields = ["title","assignedBy","assignedTo","description","taskAssignedDate","targetDate","completeDate","complexity","status"];
    fields.forEach(f => { if(body[f]!==undefined) task[f] = body[f]; });

    if(body.developers){
      const newDev = encodeDevelopers(body.developers);
      if(JSON.stringify(newDev) !== JSON.stringify(task.developers)) task.status = "in-progress";
      task.developers = newDev;
    }

    ["sowFile","inputFile","outputFile"].forEach(f => {
      if(req.files?.[f]?.[0]) task[f] = `uploads/${req.files[f][0].filename}`;
    });

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

// SUBMIT TASK
export const submitTask = async (req,res)=>{
  try{
    const {id}=req.params;
    const body=cleanBody(req.body);
    const task=await Task.findById(id);
    if(!task) return res.status(404).json({error:"Task not found"});

    let domains = body.domain ? (typeof body.domain === "string" ? JSON.parse(body.domain) : body.domain) : [];
    if (!Array.isArray(domains)) domains = [domains];

    const files = req.files?.files?.map(f => `uploads/${f.filename}`) || [];

    const submissionData = {
      platform: body.platform,
      typeOfDelivery: normalizeEnum(body.typeOfDelivery, ["api","data as a service"]),
      typeOfPlatform: normalizeEnum(body.typeOfPlatform, ["web","app","both"]),
      complexity: normalizeEnum(body.complexity, ["Low","Medium","High","Very High"]),
      userLogin: body.userLogin===true||body.userLogin==="true",
      proxyUsed: body.proxyUsed===true||body.proxyUsed==="true",
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
      outputUrl: body.outputUrl||null,
      loginType: body.loginType,
      credentials: body.credentials,
      submittedAt: new Date(),
      status: body.status ? String(body.status).toLowerCase() : "submitted",
      remarks: body.remarks||""
    };

    if(!task.submissions||typeof task.submissions!=="object") task.submissions={};

    const setSubmission=(key,data)=>{
      if(task.submissions instanceof Map) task.submissions.set(key,data);
      else task.submissions[key]=data;
    };

    if(domains.length>0){
      domains.forEach(d => setSubmission(d, submissionData));
    } else {
      Object.assign(task, submissionData);
    }

    // Update task status based on all developers
    const devKeys = Object.keys(decodeDevelopers(task.developers||{}));
    const subsDecoded = decodeSubmissions(task.submissions||{});
    if(devKeys.length > 0){
      const allSubmitted = devKeys.every(k => {
        const sub = subsDecoded[k];
        return sub && sub.status==="submitted";
      });
      task.status = allSubmitted ? "submitted" : "in-progress";
      task.completeDate = allSubmitted ? new Date() : null;
    } else {
      task.status="in-progress"; task.completeDate=null;
    }

    await task.save();
    const obj=task.toObject();
    obj.developers = decodeDevelopers(obj.developers || {});
    obj.submissions = decodeSubmissions(obj.submissions || {});
    res.json(obj);

  }catch(err){console.error("SubmitTask Error:",err); res.status(500).json({error:err.message||"Server error"});}
};

// GET TASKS
export const getTask = async (req,res)=>{
  try{
    const {search="",status,page=1,limit=10} = req.query;
    const skip = (parseInt(page)-1)*parseInt(limit);

    let userId, role;
    const token = req.headers.authorization?.split(" ")[1];
    if(token){ try { const decoded=jwtDecode(token); userId=decoded?.id; role=decoded?.role; } catch{} }

    const query={};
    if(status) query.status=status.toLowerCase();

    let tasksRaw = await Task.find(query)
      .populate("assignedBy","name role")
      .populate("assignedTo","name role")
      .sort({_id:-1})
      .lean();

      tasksRaw = tasksRaw.map(task => {
      const domains = (task.domains || []).map(d => ({
        name: d.name,
        status: d.status || "pending"
      }));
      return { ...task, domains };
    });

    // Role-based filtering
    if(role==="Developer" && userId){
      tasksRaw = tasksRaw.filter(task=>{
        const assignedToId = typeof task.assignedTo==="string"?task.assignedTo:task.assignedTo?._id?.toString();
        const developersMatches = Object.values(task.developers||{}).some(a=>a.map(String).includes(userId));
        return assignedToId===userId || developersMatches;
      });
    }

    // Collect all developer IDs to batch fetch names
    const allDevIds = new Set();
    tasksRaw.forEach(task=>{
      const devMap = decodeDevelopers(task.developers||{});
      Object.values(devMap).forEach(arr=>arr.forEach(id=>allDevIds.add(String(id))));
    });
    const users = await User.find({_id: {$in: Array.from(allDevIds)}}).select("name");
    const userMap = {}; users.forEach(u=>userMap[String(u._id)] = u.name);

    // Decode developers, submissions, delayed status
    tasksRaw.forEach(task=>{
      task.developers = decodeDevelopers(task.developers||{});
      for(const dom of Object.keys(task.developers)){
        task.developers[dom] = (task.developers[dom]||[]).map(id=>userMap[String(id)]||id);
      }
      task.submissions = decodeSubmissions(task.submissions||{});
      task.status = applyDelayedStatus(task).status;
      task.assignedBy = task.assignedBy?.name||"-";
      task.assignedTo = task.assignedTo?.name||"-";
    });

    // Search
    if(search.trim()){
      const s = search.toLowerCase();
      tasksRaw = tasksRaw.filter(t=>{
        const devStr = Object.values(t.developers||{}).flat().join(" ").toLowerCase();
        return t.projectCode.toLowerCase().includes(s) ||
               (t.title||"").toLowerCase().includes(s) ||
               (t.assignedBy||"").toLowerCase().includes(s) ||
               (t.assignedTo||"").toLowerCase().includes(s) ||
               devStr.includes(s);
      });
    }

    const total = tasksRaw.length;
    const tasksPage = tasksRaw.slice(skip, skip+parseInt(limit));
    res.json({tasks: tasksPage, total, page: parseInt(page), limit: parseInt(limit)});

  }catch(err){console.error("GetTask Error:",err); res.status(500).json({error:err.message||"Server error"});}
};

// GET SINGLE TASK
export const getSingleTask = async (req,res)=>{
  try{
    const task = await Task.findById(req.params.id).populate("assignedBy","name role").populate("assignedTo","name role");

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
  return res.status(400).json({ message: "Invalid task ID" });
}

    if(!task) return res.status(404).json({message:"Task not found"});
    const obj = task.toObject();
    obj.developers = decodeDevelopers(obj.developers||{});
    obj.submissions = decodeSubmissions(obj.submissions||{});
    obj.assignedBy = obj.assignedBy?.name||"-";
    obj.assignedTo = obj.assignedTo?.name||"-";
    res.json(obj);
  }catch(err){console.error("GetSingleTask Error:",err); res.status(500).json({message:"Failed to fetch task"});}
};

// DOMAIN STATS
// export const getDomainStats = async (req,res)=>{
//   try{
//     const tasks = await Task.find({}).lean();
//     const stats = {
//       total: tasks.length,
//       completed: tasks.filter(t=>t.status==="submitted").length,
//       pending: tasks.filter(t=>t.status==="pending").length,
//       inProgress: tasks.filter(t=>t.status==="in-progress").length,
//       delayed: tasks.filter(t=>t.status==="delayed").length,
//       inRD: tasks.filter(t=>t.status==="in-R&D").length,
//     };
//     res.json(stats);
//   }catch(err){console.error("DomainStats Error:",err); res.status(500).json({message:"Failed to fetch stats"});}
// };

// GET DOMAIN STATS PER DOMAIN NAME
export const getDomainStats = async (req, res) => {
  try {
    const tasks = await Task.find({}).lean();

    const domainStats = {}; // { "web": { total: X, pending: Y, ... }, ... }

    tasks.forEach(task => {
      (task.domains || []).forEach(domain => {
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
        if (status === "pending") domainStats[name].pending += 1;
        else if (status === "in-progress") domainStats[name]["in-progress"] += 1;
        else if (status === "delayed") domainStats[name].delayed += 1;
        else if (status === "in-R&D") domainStats[name]["in-R&D"] += 1;
        else if (status === "submitted") domainStats[name].submitted += 1;
      });
    });

    res.json(domainStats);
  } catch (err) {
    console.error("DomainStats Error:", err);
    res.status(500).json({ message: "Failed to fetch domain stats" });
  }
};

// DEVELOPERS TASK STATUS
export const getDevelopersTaskStatus = async (req,res)=>{
  try{
    const tasks = await Task.find({}).lean();
    const stats = {};
    tasks.forEach(task=>{
      const devMap = decodeDevelopers(task.developers||{});
      Object.values(devMap).forEach(arr=>{
        arr.forEach(uid=>{
          const id = String(uid);
          if(!stats[id]) stats[id] = {total:0,completed:0,pending:0};
          stats[id].total += 1;
          if(task.status==="submitted") stats[id].completed+=1;
          else stats[id].pending+=1;
        });
      });
    });
    res.json(stats);
  }catch(err){console.error("DevTaskStatus Error:",err); res.status(500).json({error:err.message||"Server error"});}
};


// UPDATE DOMAIN STATUS
export const updateTaskDomainStatus = async (req, res) => {
  try {
    const { taskId, domainName, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const domain = task.domains.find(d => d.name === domainName);
    if (!domain) return res.status(404).json({ message: "Domain not found" });

    domain.status = status;
    if (status === "submitted") domain.completeDate = new Date();

    await task.save();
    res.json({ message: "Domain status updated", task });

  } catch (err) {
    console.error("updateTaskDomainStatus Error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}; 

