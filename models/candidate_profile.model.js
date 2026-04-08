import mongoose from "mongoose";
const { Schema } = mongoose;

const candidateProfileSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profilePhoto: {
      url: String,
      public_id: String,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    bio: {
      type: String,
      maxlength: 1000,
    },

    // ─── Experience ───────────────────────────────────────────
    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },

    currentSalary: {
      amount: { type: Number },
      currency: { type: String, default: "INR" },
    },

    expectedSalary: {
      amount: { type: Number },
      currency: { type: String, default: "INR" },
    },

    // ─── Skills ───────────────────────────────────────────────
    skills: [
      {
        name: { type: String, trim: true },
        level: {
          type: String,
          enum: ["beginner", "intermediate", "advanced", "expert"],
        },
      },
    ],

    // ─── Education ────────────────────────────────────────────
    education: [
      {
        institution: { type: String, trim: true },
        degree: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
        isCurrent: { type: Boolean, default: false },
      },
    ],

    // ─── Work Experience ──────────────────────────────────────
    workExperience: [
      {
        company: { type: String, trim: true },
        title: { type: String, trim: true },
        location: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        isCurrent: { type: Boolean, default: false },
        description: { type: String },
      },
    ],

    // ─── Resume ───────────────────────────────────────────────
    resumeFile: {
      url: String,
      public_id: String,
      originalName: String,
      uploadedAt: { type: Date, default: Date.now },
    },

    resumeScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // ─── Location ─────────────────────────────────────────────
    location: {
      city: String,
      state: String,
      country: String,
      isRemoteOpen: { type: Boolean, default: false },
    },

    // ─── Links ────────────────────────────────────────────────
    linkedinUrl: {
      type: String,
      trim: true,
    },

    portfolioUrl: {
      type: String,
      trim: true,
    },

    // ─── Job Preferences ──────────────────────────────────────
    jobPreferences: {
      jobType: [
        {
          type: String,
          enum: ["full-time", "part-time", "contract", "freelance", "internship"],
        },
      ],
      preferredRoles: [{ type: String, trim: true }],
      preferredLocations: [{ type: String, trim: true }],
      noticePeriod: {
        type: String,
        enum: ["immediately", "15days", "30days", "60days", "90days"],
      },
    },

    // ─── Premium ──────────────────────────────────────────────
    isPremium: {
      type: Boolean,
      default: false,
    },

    premiumExpiresAt: {
      type: Date,
      default: null,
    },

    // ─── Visibility ───────────────────────────────────────────
    isProfilePublic: {
      type: Boolean,
      default: true,
    },

    profileCompleteness: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Auto-calculate profile completeness before save ──────────
candidateProfileSchema.pre("save", function () {
  const fields = [
    this.profilePhoto?.url,
    this.headline,
    this.bio,
    this.skills?.length > 0,
    this.education?.length > 0,
    this.workExperience?.length > 0,
    this.resumeFile?.url,
    this.location?.city,
    this.linkedinUrl,
    this.jobPreferences?.jobType?.length > 0,
  ];

  const filled = fields.filter(Boolean).length;
  this.profileCompleteness = Math.round((filled / fields.length) * 100);
});

// ─── Instance method: check if premium is still active ────────
candidateProfileSchema.methods.isPremiumActive = function () {
  return this.isPremium && this.premiumExpiresAt > new Date();
};

// ─── Index for recruiter search (premium feature) ─────────────
candidateProfileSchema.index({ "skills.name": 1 });
candidateProfileSchema.index({ "location.city": 1, "location.country": 1 });
candidateProfileSchema.index({ isPremium: 1, updatedAt: -1 });
candidateProfileSchema.index({ experienceYears: 1 });

const CandidateProfile = mongoose.model("CandidateProfile", candidateProfileSchema);
export default CandidateProfile;