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
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");

    const dateSuffix = `${year}_${month}_${day}_${hours}_${minutes}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);

    let newFileName = `${baseName}_${dateSuffix}${ext}`;
    const existingFiles = fs.readdirSync(uploadDir);

    // check if file with same name already exists (any version)
    const sameFileExists = existingFiles.some(f =>
      f.startsWith(baseName) && f.endsWith(ext)
    );

    // if exists, trim the date suffix and use base name
    if (sameFileExists) {
      newFileName = `${baseName}${ext}`;
    }
    cb(null, newFileName);
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
  upload.single('file'), 
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
router.get("/tasks/developers", authorize(['Manager','Admin']), getDevelopersDomainStatus);
router.get("/tasks/stats", authorize(['Admin','Sales','TL','Developer','Manager']), getDomainStats);
router.get("/tasks", authorize(['Admin','Sales','TL','Developer','Manager']), developerOnly, getTask);
router.get("/tasks/:id", authorize(['Admin','Sales','TL','Developer','Manager']), getSingleTask);
// TL and Manager can update domain status



router.get("/tasks/developers", authorize(['Manager',]), getDevelopersDomainStatus);


export default router;


