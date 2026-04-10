import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.utils.js";




//    ======================================================
//       Register User
//    ======================================================
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role = "candidate" } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, Email, Password, Phone and Role all fields are required",
      });
    }

    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin registration is not allowed",
      });
    }

    const userExist = await User.findOne({ email: email });

    if (userExist) {
      return res.status(409).json({
        success: false,
        message: "User already exist",
      });
    }

    const user = await User.create({
      name: name,
      email: email,
      password: password,
      phone: phone,
      role: role,
    });

    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//    ======================================================
//       Login User
//    ======================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password required",
      });
    }

    const user = await User.findOne({ email, status: "active" });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update the last Login Date
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const userData = user.toObject();
    delete userData.password;

    return res
      .cookie("accessToken", accessToken, {
        maxAge: 900000, // 15 minutes
        httpOnly: true, // prevents JS access
        secure: process.env.NODE_ENV === "production" ? true : false, // only send cookie over HTTPS in production
        // sameSite: "strict", // CSRF protection
      })
      .status(200)
      .json({
        success: true,
        user: userData,
        accessToken,
        refreshToken,
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//    ======================================================
//       Logout User
//    ======================================================
export const logoutUser = async (req, res) => {
  try {
    return res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//    ======================================================
//       Get All Users
//    ======================================================
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "active" }).select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//    ======================================================
//       Get Single User
//    ======================================================
export const getUser = async (req, res) => {
  try {
    const id = req.user._id;
    const userExist = await User.findById(id).select("-password");

    if (!userExist || userExist.status !== "active") {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      success: true,
      data: userExist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//    ======================================================
//       Update User
//    ======================================================
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const { name, email, phone, bio, workExperience, education, skills } =
      req.body;

    const userExist = await User.findById(userId);

    if (!userExist || userExist.status !== "active") {
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findByIdAndUpdate(
      { _id: userId },
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(bio !== undefined && { bio }),
        ...(workExperience && { workExperience }),
        ...(education && { education }),
        ...(skills && { skills }),
      },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//    ======================================================
//       Delete User
//    ======================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // const deleteUser = await User.findOneAndDelete({_id: id, });
    const userExist = await User.findOne({ _id: id });

    if (!userExist || userExist.status != "active") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (userExist.status == "suspended") {
      return res.status(400).json({
        success: false,
        message: "User already deleted",
      });
    }

    const deletedUser = await User.findOneAndUpdate(
      { _id: id },
      { status: "suspended" },
      { new: true },
    );

    if (!deletedUser?._id) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete the user",
        data: deletedUser,
      });
    }

    return res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//   ======================================================
//      Permanent Delete User
//   ======================================================
export const permanentDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userExist = await User.findOne({ _id: id });

    if (!userExist) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (userExist.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin users cannot be permanently deleted",
      });
    }

    if (userExist.status != "suspended") {
      return res.status(400).json({
        success: false,
        message: "User must be suspended before permanent deletion",
      });
    }

    const deleteUser = await User.findOneAndDelete({
      _id: id,
      status: "suspended",
    });

    if (!deleteUser?._id) {
      return res.status(404).json({
        success: false,
        message: "User not found or user is not suspended",
      });
    }

    return res.json({
      success: true,
      message: "User permanently deleted",
      data: deleteUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



//    ======================================================
//       Change User Password
//    ======================================================
export const changeUserPassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    console.log("userId", userId);
    console.log("Body", req.body);

    // Validate fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password and confirm password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Get user with password
    const user = await User.findById(userId);

    if (!user || user.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password is correct
    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check new password is not same as current password
    const isSamePassword = await user.comparePassword(newPassword);

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as current password",
      });
    }

    // Update password — pre save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};