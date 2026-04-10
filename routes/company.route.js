import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import {
  createCompany,
  deleteCompany,
  getAllCompanies,
  getCompany,
  getMyCompany,
  restoreCompany,
  updateCompany,
} from "../controllers/company.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Employer routes
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("employer"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "culturePhotos", maxCount: 5 },
  ]),
  createCompany,
);

router.get(
  "/my-company",
  authMiddleware,
  roleMiddleware("employer"),
  getMyCompany,
);

router.put(
  "/update/company",
  authMiddleware,
  roleMiddleware("employer"),
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "culturePhotos", maxCount: 5 },
  ]),
  updateCompany,
);

router.delete(
  "/delete/company/:companyId",
  authMiddleware,
  roleMiddleware("employer", "admin"),
  deleteCompany,
);

// Public routes
router.get(
  "/all-companies",
  // authMiddleware,
  // roleMiddleware("admin", "candidate", "employer"),
  getAllCompanies,
);
router.get("/:id", getCompany);
router.patch("/restore/:companyId", restoreCompany);

export default router;
