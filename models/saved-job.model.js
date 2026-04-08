// models/SavedJob.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const savedJobSchema = new Schema(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    savedAt: {
      type: Date,
      default: Date.now,
    },

    // ─── Optional: notify candidate if job is closing soon ────
    notifyOnExpiry: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false, // savedAt is sufficient here
  }
);

// ─── A candidate can save a job only once ─────────────────────
savedJobSchema.index(
  { candidateId: 1, jobId: 1 },
  { unique: true }
);

const SavedJob = mongoose.model("SavedJob", savedJobSchema);
export default SavedJob;