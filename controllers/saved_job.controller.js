import Job from "../models/job.model.js";
import SavedJob from "../models/saved-job.model.js";

// =================================================================================
//    Save a Job  (Candidate)
// =================================================================================
export const saveJob = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { jobId } = req.params;
    const { notifyOnExpiry = false } = req.body;

    // Job must exist and be approved
    const job = await Job.findOne({ _id: jobId, status: "approved" });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or is no longer available",
      });
    }

    if (job.isExpired()) {
      return res.status(400).json({
        success: false,
        message: "Cannot save an expired job listing",
      });
    }

    const saved = await SavedJob.create({ candidateId, jobId, notifyOnExpiry });

    return res.status(201).json({
      success: true,
      message: "Job saved successfully",
      data: saved,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already saved this job",
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Unsave a Job  (Candidate)
// =================================================================================
export const unsaveJob = async (req, res) => {
  try {
    const deleted = await SavedJob.findOneAndDelete({
      jobId: req.params.jobId,
      candidateId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    return res.json({ success: true, message: "Job removed from saved list" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Get My Saved Jobs  (Candidate)
// =================================================================================
export const getMySavedJobs = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { page = 1, limit = 20, includeExpired = "false" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch saved records and populate job details
    let savedJobs = await SavedJob.find({ candidateId })
      .populate({
        path: "jobId",
        select:
          "title jobType location salary status expiresAt isPremium isFeatured",
        populate: { path: "companyId", select: "companyName logo location" },
      })
      .sort({ savedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Filter out jobs that were deleted from the Job collection
    savedJobs = savedJobs.filter((s) => s.jobId !== null);

    // Optionally strip expired jobs from the response
    if (includeExpired === "false") {
      savedJobs = savedJobs.filter((s) => {
        const job = s.jobId;
        return (
          job.status === "approved" &&
          (!job.expiresAt || new Date(job.expiresAt) > new Date())
        );
      });
    }

    const total = await SavedJob.countDocuments({ candidateId });

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: savedJobs.length,
      data: savedJobs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Check if a Job is Saved  (Candidate)
// =================================================================================
export const isJobSaved = async (req, res) => {
  try {
    const saved = await SavedJob.exists({
      candidateId: req.user._id,
      jobId: req.params.jobId,
    });

    return res.json({ success: true, isSaved: !!saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Toggle Expiry Notification  (Candidate)
// =================================================================================
export const toggleExpiryNotification = async (req, res) => {
  try {
    const saved = await SavedJob.findOne({
      candidateId: req.user._id,
      jobId: req.params.jobId,
    });

    if (!saved) {
      return res.status(404).json({
        success: false,
        message: "Saved job not found",
      });
    }

    saved.notifyOnExpiry = !saved.notifyOnExpiry;
    await saved.save();

    return res.json({
      success: true,
      message: `Expiry notifications ${saved.notifyOnExpiry ? "enabled" : "disabled"}`,
      data: { notifyOnExpiry: saved.notifyOnExpiry },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Clear All Saved Jobs  (Candidate)
// =================================================================================
export const clearSavedJobs = async (req, res) => {
  try {
    const result = await SavedJob.deleteMany({ candidateId: req.user._id });

    return res.json({
      success: true,
      message: `Cleared ${result.deletedCount} saved job(s)`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Get Jobs with Expiry Notifications Enabled  (Internal — cron / notification service)
// =================================================================================
export const getJobsWithExpiryNotifications = async (req, res) => {
  try {
    const { daysUntilExpiry = 3 } = req.query;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + Number(daysUntilExpiry));

    // Find saved records where notifyOnExpiry is on and the job expires within the window
    const records = await SavedJob.find({ notifyOnExpiry: true })
      .populate({
        path: "jobId",
        match: {
          status: "approved",
          expiresAt: { $gte: new Date(), $lte: cutoff },
        },
        select: "title expiresAt companyId",
        populate: { path: "companyId", select: "companyName" },
      })
      .populate("candidateId", "name email");

    // Strip records where the job didn't match the populate filter
    const filtered = records.filter((r) => r.jobId !== null);

    return res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
