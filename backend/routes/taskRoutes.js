import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import { authorize, developerOnly} from "../middleware/Autho.js";

import {
  createTask,
  getTask,
  //getStats,
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
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/tasks", authorize(['Admin','Sales','Manager']), upload.fields([
  { name: "sowFile", maxCount: 1 },
  { name: "inputFile", maxCount: 1 },
]), createTask);

router.put(
  "/tasks/domain-status",
  authorize(['TL','Manager','Admin']),
  updateTaskDomainStatus
); 
router.put("/tasks/:id", authorize(['Admin','Sales','TL','Manager']), upload.fields([
  { name: "sowFile", maxCount: 1 },
  { name: "inputFile", maxCount: 1 },
]), updateTask);


router.post("/tasks/:id/submit", authorize(['Admin','TL','Developer','Manager']), upload.fields([
  { name: "sowFile", maxCount: 1 },
  { name: "inputFile", maxCount: 1 },
  { name: "files", maxCount: 20 },
]), submitTask);
router.get("/tasks/developers", authorize(['Manager']), getDevelopersDomainStatus);
router.get("/tasks/stats", authorize(['Admin','Sales','TL','Developer','Manager']), getDomainStats);
router.get("/tasks", authorize(['Admin','Sales','TL','Developer','Manager']), developerOnly, getTask);
router.get("/tasks/:id", authorize(['Admin','Sales','TL','Developer','Manager']), getSingleTask);
// TL and Manager can update domain status



router.get("/tasks/developers", authorize(['Manager',]), getDevelopersDomainStatus);


export default router;


