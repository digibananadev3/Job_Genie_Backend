import express from "express";
import {
  createJob,
  getAllJobs,
  getJob,
  getMyJobs,
  updateJob,
  closeJob,
  deleteJob,
  adminGetAllJobs,
  approveJob,
  rejectJob,
  toggleFeaturedJob,
} from "../controllers/job.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// ============================================================================
//    GET ALL JOBS      
// ============================================================================
router.get("/all-jobs", getAllJobs);

// ============================================================================
//    GET SINGLE SPECIFIC JOBS   ->    ONLY APPROVED JOBs      
// ============================================================================
router.get("/:id", getJob);

// =============================================================================
//    Create Job    ->   ( But that job status is "pending")  
// =============================================================================
router.post("/create", authMiddleware, roleMiddleware("employer"), createJob);


// ============================================================================
//    GET ALL JOBS OF SPECIFIC COMPANY
// ============================================================================
router.get(
  "/employer/my",
  authMiddleware,
  roleMiddleware("employer"),
  getMyJobs,
);

// PATCH  /api/jobs/:id         — edit draft/rejected job (re-submits as pending)
router.patch("/:id", authMiddleware, roleMiddleware("employer"), updateJob);

// PATCH  /api/jobs/:id/close   — close an active job listing
router.patch(
  "/:id/close",
  authMiddleware,
  roleMiddleware("employer"),
  closeJob,
);

// DELETE /api/jobs/:id         — permanently delete a draft job
router.delete("/delete/:id", authMiddleware, roleMiddleware("employer"), deleteJob);

// =============================================================================
//  Admin
// =============================================================================

// GET    /api/jobs/admin/all           — all jobs (any status)
//        Query params: status, page, limit
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminGetAllJobs,
);

// PATCH  /api/jobs/admin/:id/approve   — approve a pending job
router.patch(
  "/admin/:jobId/approve",
  authMiddleware,
  roleMiddleware("admin"),
  approveJob,
);

// PATCH  /api/jobs/admin/:id/reject    — reject a pending job
//        Body: { reason: string }
router.patch(
  "/admin/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  rejectJob,
);

// PATCH  /api/jobs/admin/:id/featured  — toggle isFeatured flag
router.patch(
  "/admin/:id/featured",
  authMiddleware,
  roleMiddleware("admin"),
  toggleFeaturedJob,
);

export default router;
