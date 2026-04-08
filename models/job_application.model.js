// models/JobApplication.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const jobApplicationSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ─── Application Content ──────────────────────────────────
    resumeUsed: {
      url: { type: String, required: true },
      public_id: String,
      originalName: String,
    },

    coverLetter: {
      type: String,
      default: null,
    },

    // ─── AI Match Score (employer premium feature) ────────────
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    matchBreakdown: {
      skills: { type: Number, default: null },       // % skill overlap
      experience: { type: Number, default: null },   // experience fit
      location: { type: Number, default: null },     // location match
      salary: { type: Number, default: null },       // salary fit
    },

    // ─── Status ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ["applied", "viewed", "shortlisted", "rejected", "hired"],
      default: "applied",
      index: true,
    },

    // ─── Employer Notes (internal, not visible to candidate) ──
    employerNote: {
      type: String,
      default: null,
    },

    // ─── Timestamps ───────────────────────────────────────────
    appliedAt: {
      type: Date,
      default: Date.now,
    },

    viewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ─── One application per candidate per job ────────────────────
jobApplicationSchema.index(
  { jobId: 1, candidateId: 1 },
  { unique: true }
);

// ─── Employer premium filter indexes ─────────────────────────
jobApplicationSchema.index({ jobId: 1, status: 1 });
jobApplicationSchema.index({ jobId: 1, matchScore: -1 });        // sort by match

const JobApplication = mongoose.model("JobApplication", jobApplicationSchema);
export default JobApplication;