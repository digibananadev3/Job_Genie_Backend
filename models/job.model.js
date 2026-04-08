// models/Job.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      default: null,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    // ─── Basic Info ───────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
    },

    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],

    // ─── Experience & Salary ──────────────────────────────────
    experienceMin: {
      type: Number,
      min: 0,
      default: 0,
    },

    experienceMax: {
      type: Number,
      min: 0,
    },

    salary: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
      currency: { type: String, default: "INR" },
      isDisclosed: { type: Boolean, default: true },
    },

    // ─── Location ─────────────────────────────────────────────
    location: {
      city: String,
      state: String,
      country: String,
    },

    jobType: {
      type: String,
      enum: ["full-time", "part-time", "remote", "contract", "internship", "freelance"],
      required: true,
    },

    // ─── Status & Moderation ──────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "closed", "expired"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    // ─── Premium & Boost ──────────────────────────────────────
    isPremium: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    premiumBoostDate: {
      type: Date,
      default: null,
    },

    autoBoostEveryDays: {
      type: Number,
      default: null,
    },

    // ─── Expiry ───────────────────────────────────────────────
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ─── Stats ────────────────────────────────────────────────
    viewsCount: {
      type: Number,
      default: 0,
    },

    applicationsCount: {
      type: Number,
      default: 0,
    },

    isNewsletterIncluded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for search & filters ─────────────────────────────
jobSchema.index({ title: "text", description: "text" });         // full-text search
jobSchema.index({ "location.city": 1, "location.country": 1 });
jobSchema.index({ skillsRequired: 1 });
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ isPremium: -1, premiumBoostDate: -1 });        // premium jobs first
jobSchema.index({ isFeatured: -1, createdAt: -1 });              // homepage featured

// ─── Auto-expire check ────────────────────────────────────────
jobSchema.methods.isExpired = function () {
  return this.expiresAt && this.expiresAt < new Date();
};

// ─── Check if job needs auto-boost ───────────────────────────
jobSchema.methods.needsBoost = function () {
  if (!this.autoBoostEveryDays || !this.premiumBoostDate) return false;
  const nextBoost = new Date(this.premiumBoostDate);
  nextBoost.setDate(nextBoost.getDate() + this.autoBoostEveryDays);
  return new Date() >= nextBoost;
};

const Job = mongoose.model("Job", jobSchema);
export default Job;