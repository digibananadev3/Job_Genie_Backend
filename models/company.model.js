import mongoose from "mongoose";
const { Schema } = mongoose;

const companySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      url: String,
      public_id: String,
    },

    bannerImage: {
      url: String,
      public_id: String,
    },

    website: {
      type: String,
      trim: true,
    },

    industry: {
      type: String,
      trim: true,
    },

    companySize: {
      type: String,
      enum: ["1-10", "11-50", "50-200", "200-500", "500+"],
    },

    foundedYear: {
      type: Number,
    },

    city: String,
    state: String,
    country: String,

    about: {
      type: String,
    },

    culturePhotos: [
      {
        url: String,
        public_id: String,
      },
    ],

    introVideo: {
      type: String,
    },

    whyJoinUs: {
      type: String,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    premiumExpiresAt: {
      type: Date,
      default: null,
    },


    // ─── Soft Delete ──────────────────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,                // null = self deleted, id = admin deleted
    },
  },
  {
    timestamps: true,
  },
);



// ─── Query helper — always filter out deleted companies ───────
// Lets you write Company.notDeleted().find(...) anywhere
companySchema.query.notDeleted = function () {
  return this.where({ isDeleted: false });
};

// ─── Instance method — soft delete ───────────────────────────
companySchema.methods.softDelete = function (deletedByUserId = null) {
  this.isDeleted  = true;
  this.deletedAt  = new Date();
  this.deletedBy  = deletedByUserId;
  return this.save();
};

// ─── Instance method — restore ────────────────────────────────
companySchema.methods.restore = function () {
  this.isDeleted  = false;
  this.deletedAt  = null;
  this.deletedBy  = null;
  return this.save();
};

const Company = mongoose.model("Company", companySchema);
export default Company;
