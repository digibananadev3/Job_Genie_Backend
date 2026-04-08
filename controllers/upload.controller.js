import fs from "fs";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
} from "../utils/cloudinary.js";
// import cloudinary from "../utils/cloudinary.js";
import {v2 as cloudinary} from "cloudinary";

// Upload Single Image
export const uploadSingle = async (req, res) => {
  try {
    const file = req.file;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const result = await uploadToCloudinary(file);

    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Upload Multiple Images
export const uploadMultiple = async (req, res) => {
  try {
    const files = req.files;

    const uploadedFiles = [];

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Files are required",
      });
    }

    for (let file of files) {
      const result = await uploadToCloudinary(file);

      uploadedFiles.push({
        url: result.secure_url,
        public_id: result.public_id,
      });

      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }

    return res.json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Upload PDF
export const uploadPDF = async (req, res) => {
  try {
    const file = req.file;

    const result = await cloudinary.uploader.upload(file.path, {
      folder: "job-genie/resumes",
      resource_type: "raw", // IMPORTANT for PDF
    });

    if (file?.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Single File
export const deleteFile = async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: "public_id is required",
      });
    }

    await deleteFromCloudinary(public_id);

    return res.json({
      success: true,
      message: "File deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Multiple Files
export const deleteMultipleFiles = async (req, res) => {
  try {
    const { public_ids } = req.body;

    if (!public_ids || !Array.isArray(public_ids)) {
      return res.status(400).json({
        success: false,
        message: "public_ids array is required",
      });
    }

    await deleteMultipleFromCloudinary(public_ids);

    return res.json({
      success: true,
      message: "Files deleted",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
