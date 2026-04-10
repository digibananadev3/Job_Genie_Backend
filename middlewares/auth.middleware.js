import jwt from "jsonwebtoken";
import User from "../models/user.model.js";



export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    console.log("token", token);
    if(!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    req.user = user;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};