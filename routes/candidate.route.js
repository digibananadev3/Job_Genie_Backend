import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { imageUpload, resumeUpload } from "../middlewares/upload.middleware.js";
import {
  adminGetAllProfiles,
  createProfile,
  deleteProfilePhoto,
  deleteResume,
  getMyProfile,
  getPublicProfile,
  saveResumeScore,
  searchCandidates,
  setPremiumStatus,
  updateProfile,
  uploadProfilePhoto,
  uploadResume,
} from "../controllers/candidate.controller.js";

const router = express.Router();

// =============================================================================
//  Candidate — Profile CRUD
// =============================================================================

// =============================================================================
//    Create Candidate Profile
// =============================================================================
router.post("/create/profile", authMiddleware, roleMiddleware("candidate"), createProfile);

// =============================================================================
//    GET SPECIFIC Candidate Profile
// =============================================================================
router.get("/me", authMiddleware, roleMiddleware("candidate"), getMyProfile);

// =============================================================================
//    UPDATE SPECIFIC Candidate Profile
// =============================================================================
router.patch("/me", authMiddleware, roleMiddleware("candidate"), updateProfile);



// =============================================================================
//    UPDATE EXISTING USER Profile Photo
// =============================================================================
router.post(
  "/me/photo",
  authMiddleware,
  roleMiddleware("candidate"),
  imageUpload.single("photo"),
  uploadProfilePhoto,
);

// =============================================================================
//    Delete EXISTING USER Profile Photo
// =============================================================================
router.delete(
  "/me/photo",
  authMiddleware,
  roleMiddleware("candidate"),
  deleteProfilePhoto,
);

// =============================================================================
//  Candidate — Resume
// =============================================================================

// POST   /api/candidate/profile/me/resume  — upload / replace resume (PDF)
router.post(
  "/me/resume",
  authMiddleware,
  roleMiddleware("candidate"),
  resumeUpload.single("resume"),
  uploadResume,
);

// DELETE /api/candidate/profile/me/resume  — remove resume
router.delete(
  "/me/resume",
  authMiddleware,
  roleMiddleware("candidate"),
  deleteResume,
);

// =============================================================================
//  Public — Declared BEFORE /:userId so "public" isn't matched as a param
// =============================================================================

// GET    /api/candidate/profile/public/:userId  — view public profile
router.get("/public/:userId", getPublicProfile);

// =============================================================================
//  Employer / Recruiter — Declared BEFORE /:userId
// =============================================================================

// GET    /api/candidate/profile/search
//        Query params: skills, city, country, experienceMin, experienceMax,
//                      jobType, isRemoteOpen, page, limit
router.get(
  "/search",
  authMiddleware,
  roleMiddleware("employer", "recruiter", "admin"),
  searchCandidates,
);

// =============================================================================
//  Admin — Declared BEFORE /:userId
// =============================================================================

// GET    /api/candidate/profile/admin/all          — list all profiles
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminGetAllProfiles,
);

// PATCH  /api/candidate/profile/admin/:userId/premium  — grant / revoke premium
router.patch(
  "/admin/:userId/premium",
  authMiddleware,
  roleMiddleware("admin"),
  setPremiumStatus,
);

// =============================================================================
//  Internal — AI service / cron
//  Dynamic /:userId routes go LAST to avoid swallowing static segments above
// =============================================================================

// PATCH  /api/candidate/profile/:userId/resume-score
router.patch(
  "/:userId/resume-score",
  authMiddleware,
  roleMiddleware("admin", "internal"),
  saveResumeScore,
);

export default router;
