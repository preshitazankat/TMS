import express from "express";

const router = express.Router();


import { createUser, loginUser, getUserProfile,getAllUsers ,editUser, changePassword,logout} from "../controllers/userController.js";
import verifyToken from "../middleware/Auth.js";


router.post("/register", createUser);
router.post("/login",  loginUser);
router.get("/all",getAllUsers);
router.get("/profile/:id",verifyToken, getUserProfile);
router.put("/edit/:id", editUser);
router.put("/change-password/", verifyToken, changePassword);
router.post("/logout",verifyToken,logout)

export default router;
  