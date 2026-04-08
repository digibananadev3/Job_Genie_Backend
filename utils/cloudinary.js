import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload Single File
export const uploadToCloudinary = async (file, folder = "job-genie") => {

  try {
    return await cloudinary.uploader.upload(file.path, {
      folder,
    });
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    throw error;
  }
};

// Delete Single File
export const deleteFromCloudinary = async (public_id) => {
  return await cloudinary.uploader.destroy(public_id);
};

// Delete Multiple Files
export const deleteMultipleFromCloudinary = async (public_ids = []) => {
  return await cloudinary.api.delete_resources(public_ids);
};

export default cloudinary;
