import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
  deleteUser,
  getUser,
  getUsers,
  loginUser,
  permanentDeleteUser,
  registerUser,
  updateUser,
} from "../controllers/auth.controller.js";



const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.delete("/delete/:id", deleteUser);

// Only logged-in users
router.get("/profile", authMiddleware, getUser);

router.patch("/update/user/:userId", authMiddleware, updateUser);

// Only admin
router.get("/all-users", authMiddleware, roleMiddleware("admin"), getUsers);

// Employer or Admin
router.get(
  "/employer-data",
  authMiddleware,
  roleMiddleware("admin", "employer"),
  getUsers,
);

router.delete(
  "/delete-user/:id",
  authMiddleware,
  roleMiddleware("admin"),
  permanentDeleteUser,
);

export default router;
