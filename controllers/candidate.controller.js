import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import CandidateProfile from "../models/candidate_profile.model.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";

// =================================================================================
//    Create Profile  (Candidate — one-time setup)
// =================================================================================
export const createProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const existing = await CandidateProfile.findOne({ userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists. Use update instead.",
      });
    }

    const profile = await CandidateProfile.create({ userId, ...req.body });

    return res.status(201).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Get My Profile  (Candidate)
// =================================================================================
export const getMyProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Update Profile  (Candidate — scalar / preference fields only)
//    File uploads (photo, resume) have dedicated endpoints below.
// =================================================================================
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "headline",
      "bio",
      "experienceYears",
      "currentSalary",
      "expectedSalary",
      "skills",
      "education",
      "workExperience",
      "location",
      "linkedinUrl",
      "portfolioUrl",
      "jobPreferences",
      "isProfilePublic",
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.user._id },
      updates,
      { new: true, runValidators: true },
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Upload / Replace Profile Photo  (Candidate)
// =================================================================================
export const uploadProfilePhoto = async (req, res) => {
  try {
    console.log("Welcome to the upload Profile Photo");
    const file = req.file;

    console.log("File", file);

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }

    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Delete old photo from Cloudinary if present
    if (profile.profilePhoto?.public_id) {
      await deleteFromCloudinary(profile.profilePhoto.public_id).catch(
        () => null,
      );
    }

    const result = await uploadToCloudinary(file);
    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    profile.profilePhoto = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    await profile.save();

    return res.json({
      success: true,
      message: "Profile photo updated",
      data: profile.profilePhoto,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Delete Profile Photo  (Candidate)
// =================================================================================
export const deleteProfilePhoto = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (!profile.profilePhoto?.public_id) {
      return res
        .status(400)
        .json({ success: false, message: "No profile photo to delete" });
    }

    await deleteFromCloudinary(profile.profilePhoto.public_id).catch(
      () => null,
    );

    profile.profilePhoto = { url: null, public_id: null };
    await profile.save();

    return res.json({ success: true, message: "Profile photo removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Upload / Replace Resume  (Candidate)
// =================================================================================
export const uploadResume = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "PDF file is required" });
    }

    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    // Delete old resume from Cloudinary if present
    if (profile.resumeFile?.public_id) {
      await cloudinary.uploader
        .destroy(profile.resumeFile.public_id, { resource_type: "raw" })
        .catch(() => null);
    }

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "job-genie/resumes",
      resource_type: "raw",
    });

    if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);

    profile.resumeFile = {
      url: result.secure_url,
      public_id: result.public_id,
      originalName: file.originalname,
      uploadedAt: new Date(),
    };

    // Reset AI score whenever resume is replaced
    profile.resumeScore = null;

    await profile.save();

    return res.json({
      success: true,
      message: "Resume uploaded successfully",
      data: profile.resumeFile,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Delete Resume  (Candidate)
// =================================================================================
export const deleteResume = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({ userId: req.user._id });

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    if (!profile.resumeFile?.public_id) {
      return res
        .status(400)
        .json({ success: false, message: "No resume to delete" });
    }

    await cloudinary.uploader
      .destroy(profile.resumeFile.public_id, { resource_type: "raw" })
      .catch(() => null);

    profile.resumeFile = { url: null, public_id: null, originalName: null };
    profile.resumeScore = null;
    await profile.save();

    return res.json({ success: true, message: "Resume deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Save Resume Score  (Internal — AI service / cron)
// =================================================================================
export const saveResumeScore = async (req, res) => {
  try {
    const { resumeScore } = req.body;

    if (resumeScore === undefined || resumeScore < 0 || resumeScore > 100) {
      return res.status(400).json({
        success: false,
        message: "resumeScore must be a number between 0 and 100",
      });
    }

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.params.userId },
      { resumeScore },
      { new: true },
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.json({
      success: true,
      data: { resumeScore: profile.resumeScore },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Get Public Profile  (Anyone — recruiters, public)
// =================================================================================
export const getPublicProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      userId: req.params.userId,
      isProfilePublic: true,
    }).populate("userId", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found or is private",
      });
    }

    // Strip sensitive fields from public view
    const data = profile.toObject();
    delete data.currentSalary;
    delete data.resumeScore;
    delete data.isPremium;
    delete data.premiumExpiresAt;
    delete data.jobPreferences;

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Search Candidates  (Employer / Recruiter — premium feature)
// =================================================================================
export const searchCandidates = async (req, res) => {
  try {
    const {
      skills,
      city,
      country,
      experienceMin,
      experienceMax,
      jobType,
      isRemoteOpen,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isProfilePublic: true };

    if (skills) {
      const skillArray = skills.split(",").map((s) => s.trim());
      query["skills.name"] = { $in: skillArray };
    }

    if (city) query["location.city"] = new RegExp(city, "i");
    if (country) query["location.country"] = new RegExp(country, "i");
    if (isRemoteOpen === "true") query["location.isRemoteOpen"] = true;

    if (experienceMin)
      query.experienceYears = {
        ...query.experienceYears,
        $gte: Number(experienceMin),
      };
    if (experienceMax)
      query.experienceYears = {
        ...query.experienceYears,
        $lte: Number(experienceMax),
      };

    if (jobType) query["jobPreferences.jobType"] = jobType;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await CandidateProfile.countDocuments(query);

    const candidates = await CandidateProfile.find(query)
      .populate("userId", "name email")
      .select(
        "-currentSalary -resumeFile -resumeScore -premiumExpiresAt -jobPreferences",
      )
      .sort({ isPremium: -1, updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: candidates.length,
      data: candidates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Admin — Get All Profiles
// =================================================================================
export const adminGetAllProfiles = async (req, res) => {
  try {
    const { isPremium, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isPremium !== undefined) query.isPremium = isPremium === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const total = await CandidateProfile.countDocuments(query);

    const profiles = await CandidateProfile.find(query)
      .populate("userId", "name email phone status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Admin — Grant / Revoke Premium
// =================================================================================
export const setPremiumStatus = async (req, res) => {
  try {
    const { isPremium, premiumExpiresAt } = req.body;

    if (typeof isPremium !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPremium (boolean) is required",
      });
    }

    const updates = { isPremium };

    if (isPremium) {
      if (!premiumExpiresAt) {
        return res.status(400).json({
          success: false,
          message: "premiumExpiresAt is required when granting premium",
        });
      }
      updates.premiumExpiresAt = new Date(premiumExpiresAt);
    } else {
      updates.premiumExpiresAt = null;
    }

    const profile = await CandidateProfile.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      { new: true },
    );

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Profile not found" });
    }

    return res.json({
      success: true,
      message: `Premium ${isPremium ? "granted" : "revoked"}`,
      data: {
        isPremium: profile.isPremium,
        premiumExpiresAt: profile.premiumExpiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
