// models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    projectCode: { type: String },
    assignedBy: {  type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: {  type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    taskAssignedDate: { type: Date, required: true },
    targetDate: { type: Date, required: true },
    completeDate: { type: Date },
    sempleFile:{type:Boolean,default:false},
    typeOfDelivery:{type:String,enum:["api","data as a service"]},
    typeOfPlatform:{type:String,enum:["web","app","both"]},
    domain: [{ type: String }],

    developers: {
  type: Map,
  of: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  default: {},
},


    // priority: { type: String, enum: ["High", "Medium", "Low",], default: "Medium" },
    status: {
      type: String,
      enum: ["pending", "in-progress", "delayed", "submitted"],
      default: "pending",
    },

    // root-level older-style submission fields (kept for backward compatibility)
    platform: { type: String },
    userLogin: { type: Boolean, default: false },
    loginType: {
      type: String,
      enum: ["Free login", "Purchased login"],
      default: null, // or "Free login"
    },
    credentials: { type: String },

    country: { type: String },
    feasibleFor: { type: String },
    approxVolume: { type: String },
    method: { type: String },
    proxyUsed: { type: Boolean, default: false },
    proxyName: { type: String },
    perRequestCredit: { type: Number },
    totalRequest: { type: Number },
    lastCheckedDate: { type: Date },
    complexity: { type: String, enum: ["Low", "Medium", "High", "Very High"] },
    githubLink: { type: String },

    // SOW / Input files & URLs at task level
    sowFile: { type: String },
    sowUrl: { type: String },
    inputFile: { type: String },
    inputUrl: { type: String },


    outputFile: { type: String },
    outputUrl: { type: String },

    submittedAt: { type: Date },
    remarks: { type: String },

    // NEW: per-domain submissions map
    // Map key = domainName, value = submission object (mixed)
    submissions: { type: Map, of: Object, default: {} },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
