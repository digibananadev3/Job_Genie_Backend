import mongoose from "mongoose";
import CandidateProfile from "../models/candidate_profile.model.js";
import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import JobApplication from "../models/job_application.model.js";

// =================================================================================
//    Apply to a Job  (Candidate)
// =================================================================================
export const applyToJob = async (req, res) => {
  try {
    const candidateId = req.user._id;
    console.log("candidateId", candidateId);
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // Job must exist and be approved
    const job = await Job.findOne({ _id: jobId, status: "approved" });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or is no longer accepting applications",
      });
    }

    // Check expiry
    if (job.isExpired()) {
      return res.status(400).json({
        success: false,
        message: "This job listing has expired",
      });
    }

    // Candidate must have a profile with a resume
    const profile = await CandidateProfile.findOne({ userId: candidateId });

    if (!profile?.resumeFile?.url) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume to your profile before applying",
      });
    }

    // Prevent duplicate applications (also enforced by unique index)
    const alreadyApplied = await JobApplication.findOne({ jobId, candidateId });

    if (alreadyApplied) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    const application = await JobApplication.create({
      jobId,
      candidateId,
      resumeUsed: {
        url: profile.resumeFile.url,
        public_id: profile.resumeFile.public_id,
        originalName: profile.resumeFile.originalName,
      },
      coverLetter: coverLetter || null,
    });

    // Increment job applications count (fire-and-forget)
    Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } }).exec();

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    // Duplicate key from unique index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get My Applications  (Candidate)
// =================================================================================
export const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { candidateId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await JobApplication.countDocuments(query);

    const applications = await JobApplication.find(query)
      .populate({
        path: "jobId",
        select: "title jobType location salary status expiresAt",
        populate: { path: "companyId", select: "companyName logo" },
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get Single Application  (Candidate — own application only)
// =================================================================================
export const getMyApplication = async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      candidateId: req.user._id,
    }).populate({
      path: "jobId",
      select: "title jobType location salary description skillsRequired status",
      populate: { path: "companyId", select: "companyName logo website" },
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Never expose internal employer notes to the candidate
    const data = application.toObject();
    delete data.employerNote;

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Withdraw Application  (Candidate)
// =================================================================================
export const withdrawApplication = async (req, res) => {
  try {
    const application = await JobApplication.findOne({
      _id: req.params.id,
      candidateId: req.user._id,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (["hired", "rejected"].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot withdraw an application that has been ${application.status}`,
      });
    }

    await application.deleteOne();

    // Decrement job applications count (fire-and-forget)
    Job.findByIdAndUpdate(application.jobId, {
      $inc: { applicationsCount: -1 },
    }).exec();

    return res.json({
      success: true,
      message: "Application withdrawn successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get Applications for a Job  (Employer)
// =================================================================================
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, sortBy = "appliedAt", page = 1, limit = 20 } = req.query;

    // Verify the job belongs to this employer's company
    const company = await Company.findOne({
      userId: req.user._id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const job = await Job.findOne({ _id: jobId, companyId: company._id });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    const query = { jobId };
    if (status) query.status = status;

    // Allow sorting by appliedAt or matchScore (premium)
    const sortOptions = {
      appliedAt: { appliedAt: -1 },
      matchScore: { matchScore: -1 },
    };
    const sort = sortOptions[sortBy] || sortOptions.appliedAt;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await JobApplication.countDocuments(query);

    const applications = await JobApplication.find(query)
      .populate("candidateId", "name email phone")
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get Single Application Detail  (Employer)
// =================================================================================
export const getApplicationDetail = async (req, res) => {
  try {
    const company = await Company.findOne({
      userId: req.user._id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const application = await JobApplication.findById(req.params.id)
      .populate("candidateId", "name email phone")
      .populate("jobId", "title companyId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Ensure the job belongs to this employer
    if (String(application.jobId.companyId) !== String(company._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Mark as viewed if still in "applied" state
    if (application.status === "applied") {
      application.status = "viewed";
      application.viewedAt = new Date();
      await application.save();
    }

    return res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Update Application Status  (Employer)
//    Covers: viewed → shortlisted → hired / rejected
// =================================================================================
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, employerNote } = req.body;

    const allowedStatuses = ["viewed", "shortlisted", "rejected", "hired"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const company = await Company.findOne({
      userId: req.user._id,
      isDeleted: false,
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
    }

    const application = await JobApplication.findById(req.params.id).populate(
      "jobId",
      "companyId",
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (String(application.jobId.companyId) !== String(company._id)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    application.status = status;
    if (employerNote !== undefined) application.employerNote = employerNote;
    if (status === "viewed" && !application.viewedAt)
      application.viewedAt = new Date();

    await application.save();

    return res.json({
      success: true,
      message: `Application marked as ${status}`,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Save / Update Match Score  (Internal — called by AI service or cron)
// =================================================================================
export const saveMatchScore = async (req, res) => {
  try {
    const { matchScore, matchBreakdown } = req.body;

    if (matchScore === undefined || matchScore < 0 || matchScore > 100) {
      return res.status(400).json({
        success: false,
        message: "matchScore must be a number between 0 and 100",
      });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      {
        matchScore,
        ...(matchBreakdown && { matchBreakdown }),
      },
      { new: true },
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    return res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Admin — Get All Applications
// =================================================================================
export const adminGetAllApplications = async (req, res) => {
  try {
    const { status, jobId, candidateId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;
    if (candidateId) query.candidateId = candidateId;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await JobApplication.countDocuments(query);

    const applications = await JobApplication.find(query)
      .populate("candidateId", "name email")
      .populate({
        path: "jobId",
        select: "title",
        populate: { path: "companyId", select: "companyName" },
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};





// =================================================================================
//    Check if Candidate Applied to a Job
// =================================================================================
export const hasAppliedToJob = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    const application = await JobApplication.findOne({
      jobId,
      candidateId,
    }).select("_id status appliedAt");

    return res.json({
      success: true,
      applied: !!application, // true/false
      data: application || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// =================================================================================
//    Get All Applied Jobs by Candidate  (with search by job title / company name)
// =================================================================================
export const userAllAppliedJobs = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { search, status, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Base pipeline
    const pipeline = [

      // Step 1: Match only this candidate's applications
      {
        $match: {
          candidateId: new mongoose.Types.ObjectId(candidateId),
          ...(status && { status }),
        },
      },

      // Step 2: Join Job
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      { $unwind: "$job" },

      // Step 3: Join Company from Job
      {
        $lookup: {
          from: "companies",
          localField: "job.companyId",
          foreignField: "_id",
          as: "company",
        },
      },
      { $unwind: "$company" },

      // Step 4: Filter out deleted companies
      {
        $match: {
          "company.isDeleted": false,
        },
      },

      // Step 5: Search by job title OR company name (case-insensitive)
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "job.title": { $regex: search, $options: "i" } },
                  { "company.companyName": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      // Step 6: Shape the output
      {
        $project: {
          _id: 1,
          status: 1,
          appliedAt: 1,
          coverLetter: 1,
          resumeUsed: 1,
          matchScore: 1,
          job: {
            _id: "$job._id",
            title: "$job.title",
            jobType: "$job.jobType",
            location: "$job.location",
            salary: "$job.salary",
            expiresAt: "$job.expiresAt",
          },
          company: {
            _id: "$company._id",
            companyName: "$company.companyName",
            logo: "$company.logo",
            industry: "$company.industry",
          },
        },
      },

      // Step 7: Sort by latest applied first
      { $sort: { appliedAt: -1 } },

      // Step 8: Pagination — run count and data in parallel
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [{ $skip: skip }, { $limit: Number(limit) }],
        },
      },
    ];

    const [result] = await JobApplication.aggregate(pipeline);

    const total = result.total[0]?.count || 0;

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: result.data.length,
      data: result.data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};