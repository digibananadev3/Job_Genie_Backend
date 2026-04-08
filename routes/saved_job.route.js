import express from "express";
import {
  saveJob,
  unsaveJob,
  getMySavedJobs,
  isJobSaved,
  toggleExpiryNotification,
  clearSavedJobs,
  getJobsWithExpiryNotifications,
} from "../controllers/saved_job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// =============================================================================
//  Candidate
// =============================================================================

// POST   /api/saved-jobs/:jobId          — save a job
//        Body: { notifyOnExpiry?: boolean }
router.post("/:jobId", authMiddleware, roleMiddleware("candidate"), saveJob);

// DELETE /api/saved-jobs/:jobId          — unsave a job
router.delete(
  "/:jobId",
  authMiddleware,
  roleMiddleware("candidate"),
  unsaveJob,
);

// GET    /api/saved-jobs                 — list own saved jobs
//        Query params: page, limit, includeExpired (default: false)
router.get("/get-all/saved/jobs", authMiddleware, roleMiddleware("candidate"), getMySavedJobs);

// GET    /api/saved-jobs/:jobId/check    — check if a specific job is saved
router.get(
  "/:jobId/check",
  authMiddleware,
  roleMiddleware("candidate"),
  isJobSaved,
);

// PATCH  /api/saved-jobs/:jobId/notify   — toggle expiry notification on/off
router.patch(
  "/:jobId/notify",
  authMiddleware,
  roleMiddleware("candidate"),
  toggleExpiryNotification,
);

// DELETE /api/saved-jobs                 — clear all saved jobs
router.delete("/remove/savedJobs", authMiddleware, roleMiddleware("candidate"), clearSavedJobs);

// =============================================================================
//  Internal — cron / notification service
// =============================================================================

// GET    /api/saved-jobs/internal/expiry-notifications
//        Query params: daysUntilExpiry (default: 3)
router.get(
  "/internal/expiry-notifications",
  authMiddleware,
  roleMiddleware("admin", "internal"),
  getJobsWithExpiryNotifications,
);

export default router;
