import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { authorize, developerOnly } from "../middleware/Autho.js";

import {
  createTask,
  getTask,
  updateTask,
  submitTask,
  getSingleTask,
  updateTaskDomainStatus,
  getDevelopersDomainStatus,
  getDomainStats
} from "../controllers/taskController.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const dateSuffix = `${year}_${month}_${day}_${hours}_${minutes}`;
    const ext = path.extname(file.originalname);

    // Extract projectName and type from request body (assuming sent from frontend)
    const projectName = req.body.title?.replace(/\s+/g, "_") || "project";
    let fileType = "file";

    if (file.fieldname === "inputFile") fileType = "inputfile";
    else if (file.fieldname === "outputFiles") fileType = "outputfile";
    else if (file.fieldname === "sowFile") fileType = "sowfile";
    else if (file.fieldname === "clientSampleSchemaFile") fileType = "clientSampleSchema";

    const newFileName = `${projectName}_${fileType}_${dateSuffix}${ext}`;
    cb(null, newFileName);
  },
});

const upload = multer({ storage });
router.post("/tasks", authorize(['Admin', 'Sales', 'Manager']), upload.fields([
  { name: "sowFile", maxCount: 10 },
  { name: "inputFile", maxCount: 10 },
  { name: "clientSampleSchemaFiles", maxCount: 20 },
]), createTask);

router.put(
  "/tasks/domain-status",
  authorize(['TL', 'Manager', 'Admin']),
  upload.single('file'),
  updateTaskDomainStatus
);
router.put(
  "/tasks/:id",
  authorize(['Admin', 'Sales', 'TL', 'Manager']),
  upload.fields([
    { name: "sowFile", maxCount: 10 },
    { name: "inputFile", maxCount: 10 },
    { name: "clientSampleSchemaFile", maxCount: 20 },
    { name: "outputFiles", maxCount: 20 },
  ]),
  updateTask
);

router.post("/tasks/:id/submit", authorize(['Admin', 'TL', 'Developer', 'Manager']), upload.fields([
{ name: "outputFiles", maxCount: 20 },
]), submitTask);
router.get("/tasks/developers", authorize(['Manager', 'Admin']), getDevelopersDomainStatus);
router.get("/tasks/stats", authorize(['Admin', 'Sales', 'TL', 'Developer', 'Manager']), getDomainStats);
router.get("/tasks", authorize(['Admin', 'Sales', 'TL', 'Developer', 'Manager']), developerOnly, getTask);
router.get("/tasks/:id", authorize(['Admin', 'Sales', 'TL', 'Developer', 'Manager']), getSingleTask);
// TL and Manager can update domain status



router.get("/tasks/developers", authorize(['Manager',]), getDevelopersDomainStatus);
export default router;


