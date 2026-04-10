import Company from "../models/company.model.js";
import Job from "../models/job.model.js";
import { formattedDates } from "../utils/formattedDate.js";

// =================================================================================
//    Create Job  (Employer)
// =================================================================================
export const createJob = async (req, res) => {
  try {
    console.log("Welcome to the Create Job Controller");
    let userId = req.user._id;

    userId = userId.toString();

    console.log("User Id", userId);




    // Employer must have a company profile
    const company = await Company.findOne({ userId: userId.toString(), isDeleted: false });

    console.log("company", company);

    if (!company) {
      return res.status(404).json({
        success: false,
        message:
          "Company profile not found. Please create a company profile first.",
      });
    }

    const {
      title,
      description,
      skillsRequired,
      experienceMin,
      experienceMax,
      salary,
      location,
      jobType,
      expiresAt,
      planId,
      orderId,
    } = req.body;

    console.log("req body", req.body);

    // expiresAt = formattedDates(expiresAt);

    console.log("expiresAt", expiresAt);

    const job = await Job.create({
      companyId: company._id,
      planId: planId || null,
      orderId: orderId || null,
      title,
      description,
      skillsRequired,
      experienceMin,
      experienceMax,
      salary,
      location,
      jobType,
      expiresAt: formattedDates(expiresAt) || null,
      status: "pending", // goes to admin review
    });

    console.log("job", job);

    return res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get All Jobs (Public) — with filters & search
// =================================================================================
// export const getAllJobs = async (req, res) => {
//   try {
//     const {
//       search,
//       jobType,
//       city,
//       country,
//       experienceMin,
//       experienceMax,
//       salaryMin,
//       salaryMax,
//       skills,
//       isFeatured,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     const query = { status: "approved" };

//     // Exclude expired jobs
//     query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];

//     // Full-text search on title + description
//     if (search) {
//       query.$text = { $search: search };
//     }

//     if (jobType) query.jobType = jobType;
//     if (city) query["location.city"] = new RegExp(city, "i");
//     if (country) query["location.country"] = new RegExp(country, "i");
//     if (isFeatured === "true") query.isFeatured = true;

//     if (experienceMin) query.experienceMin = { $gte: Number(experienceMin) };
//     if (experienceMax) query.experienceMax = { $lte: Number(experienceMax) };

//     if (salaryMin) query["salary.min"] = { $gte: Number(salaryMin) };
//     if (salaryMax) query["salary.max"] = { $lte: Number(salaryMax) };

//     if (skills) {
//       const skillArray = skills.split(",").map((s) => s.trim());
//       query.skillsRequired = { $in: skillArray };
//     }

//     const skip = (Number(page) - 1) * Number(limit);
//     const total = await Job.countDocuments(query);

//     console.log("query", query);
//     // console.log("Jobs")
//     const jobs = await Job.find(query)
//       .populate("companyId", "companyName logo location website")
//       .sort({ isPremium: -1, premiumBoostDate: -1, createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     return res.json({
//       success: true,
//       total,
//       page: Number(page),
//       pages: Math.ceil(total / Number(limit)),
//       count: jobs.length,
//       data: jobs,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      jobType,
      city,
      country,
      experienceMin,
      experienceMax,
      salaryMin,
      salaryMax,
      skills,
      isFeatured,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      status: "approved",
      $and: [
        {
          $or: [
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } },
          ],
        },
      ],
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (jobType) query.jobType = jobType;

    if (city) query["location.city"] = new RegExp(city, "i");
    if (country) query["location.country"] = new RegExp(country, "i");

    if (isFeatured === "true") query.isFeatured = true;

    // Experience Overlap Filter
    if (experienceMin && experienceMax) {
      query.experienceMin = { $lte: Number(experienceMax) };
      query.experienceMax = { $gte: Number(experienceMin) };
    } else {
      if (experienceMin) query.experienceMax = { $gte: Number(experienceMin) };
      if (experienceMax) query.experienceMin = { $lte: Number(experienceMax) };
    }

    // Salary Overlap Filter
    if (salaryMin && salaryMax) {
      query["salary.min"] = { $lte: Number(salaryMax) };
      query["salary.max"] = { $gte: Number(salaryMin) };
    } else {
      if (salaryMin) query["salary.max"] = { $gte: Number(salaryMin) };
      if (salaryMax) query["salary.min"] = { $lte: Number(salaryMax) };
    }

    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      query.skillsRequired = { $in: skillArray };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate("companyId", "companyName logo location website")
      .sort({
        isPremium: -1,
        premiumBoostDate: -1,
        createdAt: -1,
      })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get Single Job (Public)
// =================================================================================
export const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "companyId",
      "companyName logo location website industry about companySize",
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "This job is not publicly available",
      });
    }

    // Increment view count (fire-and-forget)
    Job.findByIdAndUpdate(job._id, { $inc: { viewsCount: 1 } }).exec();

    return res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get My Company's Jobs  (Employer)
// =================================================================================
export const getMyJobs = async (req, res) => {
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

    const { status, page = 1, limit = 20 } = req.query;
    const query = { companyId: company._id };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Update Job  (Employer — only draft / rejected jobs)
// =================================================================================
export const updateJob = async (req, res) => {
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

    const job = await Job.findOne({
      _id: req.params.id,
      companyId: company._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only allow edits on draft or rejected jobs
    if (!["draft", "rejected"].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit a job with status "${job.status}". Only draft or rejected jobs can be edited.`,
      });
    }

    const allowedFields = [
      "title",
      "description",
      "skillsRequired",
      "experienceMin",
      "experienceMax",
      "salary",
      "location",
      "jobType",
      "expiresAt",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Re-submit for review when employer saves an edit
    updates.status = "pending";
    updates.rejectionReason = null;

    const updatedJob = await Job.findByIdAndUpdate(job._id, updates, {
      new: true,
    });

    return res.json({
      success: true,
      data: updatedJob,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Close Job  (Employer)
// =================================================================================
export const closeJob = async (req, res) => {
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

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { status: "closed" },
      { new: true },
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.json({
      success: true,
      message: "Job closed successfully",
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Delete Job  (Employer — only draft jobs)
// =================================================================================
export const deleteJob = async (req, res) => {
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

    const job = await Job.findOne({
      _id: req.params.id,
      companyId: company._id,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.status !== "draft") {
      return res.status(400).json({
        success: false,
        message:
          "Only draft jobs can be permanently deleted. Use close job for published listings.",
      });
    }

    await job.deleteOne();

    return res.json({
      success: true,
      message: "Job deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Admin — Get All Jobs (any status)
// =================================================================================
export const adminGetAllJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(query);

    const jobs = await Job.find(query)
      .populate("companyId", "companyName logo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Admin — Approve Job
// =================================================================================
export const approveJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.jobId,
      { status: "approved", rejectionReason: null },
      { new: true },
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.json({
      success: true,
      message: "Job approved",
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Admin — Reject Job
// =================================================================================
export const rejectJob = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason },
      { new: true },
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.json({
      success: true,
      message: "Job rejected",
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Admin — Feature / Unfeature Job
// =================================================================================
export const toggleFeaturedJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    job.isFeatured = !job.isFeatured;
    await job.save();

    return res.json({
      success: true,
      message: `Job ${job.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
