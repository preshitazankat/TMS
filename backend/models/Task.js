import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., "web", "app", "both"
  status: {
    type: String,
    enum: ["pending","in-progress", "delayed", "submitted","in-R&D"],
    default: "pending",
  }, 
  statusKey: { type: String, lowercase: true, trim: true },
  completeDate: { type: Date },
  remarks: { type: String },
  submission: { type: Object, default: {} },
  developers: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    default: [],
  }, // domain-specific submission
  upload: {
    filename: String,        // stored file name on server
    originalname: String,    // original file name
    path: String,            // server path
    mimetype: String,
    size: Number,
    uploadedAt: Date,
  },
  
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    projectCode: { type: String },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String, required: true },
    sampleFileRequired: { type: Boolean, default: false },
    requiredValumeOfSampleFile: { type: Number, enum: [20, 50, 100, 500, 1000], default: null },
    taskAssignedDate: { type: Date, required: true },
    targetDate: { type: Date, required: true },
    completeDate: { type: Date },
    typeOfDelivery: { type: String, enum: ["api", "data as a service","both(api & data as a service)"] },
    typeOfPlatform: { type: String, enum: ["web", "app", "both (app & web)"] },
   
    

    // NEW: domain-wise array
    domains: { type: [domainSchema], default: [] },

    platform: { type: String }, // backward compatibility
    userLogin: { type: Boolean,  },
    loginType: { type: String, enum: ["Free login", "Paid login"], },
    credentials: { type: String },

    country: { type: [String] },
    feasibleFor: { type: String },
    approxVolume: { type: String },
    method: { type: String },
    apiName:{type:String},
    proxyUsed: { type: Boolean},
    proxyName: { type: String },
    perRequestCredit: { type: Number },
    totalRequest: { type: Number },
    lastCheckedDate: { type: Date },
    complexity: { type: String, enum: ["Low", "Medium", "High", "Very High"] },
    githubLink: { type: String },

    sowFiles: { type: [String], default: [] },
    sowUrls: { type: [String], default: [] },
    inputFiles: { type: [String], default: [] },
    inputUrls: { type: [String], default: [] },
    outputFiles: { type: [String], default: [] },
    outputUrls: { type: [String], default: [] },
    clientSampleSchemaFiles: { type:   [String], default: [] },
    clientSampleSchemaUrls: { type:   [String], default: [] },
    
    
    remarks: { type: String },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
