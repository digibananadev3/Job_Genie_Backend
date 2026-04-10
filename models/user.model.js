import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const workExperienceSchema = new Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Freelance"],
      default: "Full-time",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date, // null means "Present"
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const educationSchema = new Schema(
  {
    degree: {
      type: String,
      required: true,
      trim: true,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
    },
    startYear: {
      type: Number,
    },
    endYear: {
      type: Number, // null means ongoing
      default: null,
    },
    isOngoing: {
      type: Boolean,
      default: false,
    },
    grade: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true },
);

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["admin", "candidate", "employer"],
      default: "candidate",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      default: "",
    },

    workExperience: {
      type: [workExperienceSchema],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    skills:[{
      type: String,
      trim: true
    }],

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
