import express from "express";
import upload from "../middlewares/upload.middleware.js";
import {
  uploadSingle,
  uploadMultiple,
  uploadPDF,
  deleteFile,
  deleteMultipleFiles,
} from "../controllers/upload.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Upload
router.post("/single", authMiddleware, upload.single("file"), uploadSingle);
router.post(
  "/multiple",
  authMiddleware,
  upload.array("files", 10),
  uploadMultiple,
);
router.post("/pdf", authMiddleware, upload.single("file"), uploadPDF);

// Delete
router.delete("/single", authMiddleware, deleteFile);
router.delete("/multiple", authMiddleware, deleteMultipleFiles);

export default router;
