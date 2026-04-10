import express from "express";

import {
  applyToJob,
  getMyApplications,
  getMyApplication,
  withdrawApplication,
  getJobApplications,
  getApplicationDetail,
  updateApplicationStatus,
  saveMatchScore,
  adminGetAllApplications,
  hasAppliedToJob,
  userAllAppliedJobs,
} from "../controllers/job_application.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// =============================================================================
//  Candidate
// =============================================================================

// POST   /api/applications/jobs/:jobId     — submit application
router.post(
  "/jobs/:jobId",
  authMiddleware,
  roleMiddleware("candidate"),
  applyToJob,
);

// GET    /api/applications/me              — list own applications
//        Query params: status, page, limit
router.get(
  "/me",
  authMiddleware,
  roleMiddleware("candidate"),
  getMyApplications,
);

// GET    /api/applications/me/:id          — single own application (no employerNote)
router.get(
  "/me/:id",
  authMiddleware,
  roleMiddleware("candidate"),
  getMyApplication,
);

// DELETE /api/applications/me/:id          — withdraw application
router.delete(
  "/me/:id",
  authMiddleware,
  roleMiddleware("candidate"),
  withdrawApplication,
);

// =============================================================================
//  Employer
// =============================================================================

// GET    /api/applications/employer/jobs/:jobId
//        — list all applications for a job owned by this employer
//        Query params: status, sortBy (appliedAt | matchScore), page, limit
router.get(
  "/employer/jobs/:jobId",
  authMiddleware,
  roleMiddleware("employer"),
  getJobApplications,
);

// GET    /api/applications/employer/:id    — single application detail (auto-marks viewed)
router.get(
  "/employer/:id",
  authMiddleware,
  roleMiddleware("employer"),
  getApplicationDetail,
);

// PATCH  /api/applications/employer/:id/status  — update status / add employer note
//        Body: { status: "viewed"|"shortlisted"|"hired"|"rejected", employerNote? }
router.patch(
  "/employer/:id/status",
  authMiddleware,
  roleMiddleware("employer"),
  updateApplicationStatus,
);

// =============================================================================
//  Internal — AI service / cron
// =============================================================================

// PATCH  /api/applications/:id/match-score
//        Body: { matchScore: 0-100, matchBreakdown?: object }
router.patch(
  "/:id/match-score",
  authMiddleware,
  roleMiddleware("admin", "internal"),
  saveMatchScore,
);

// =============================================================================
//  Admin
// =============================================================================

// GET    /api/applications/admin/all
//        Query params: status, jobId, candidateId, page, limit
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminGetAllApplications,
);




router.get(
  "/jobs/:jobId/has-applied",
  authMiddleware,
  hasAppliedToJob
);


router.get("/my-applications", authMiddleware, userAllAppliedJobs);

export default router;
