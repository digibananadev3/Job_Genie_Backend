// import Company from "../models/company.model.js";
import fs from "fs";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import Company from "../models/company.model.js";

// =================================================================================
//    Create Company Controllers ( Employer Profile CRUD )
// =================================================================================
export const createCompany = async (req, res) => {
  try {
    const userId = req.user._id;

    const existingCompany = await Company.findOne({ userId });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company profile already exists",
      });
    }

    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.bannerImage?.[0];

    let logo = null;
    let bannerImage = null;
    let culturePhotos = [];

    // Upload logo
    if (logoFile) {
      const result = await uploadToCloudinary(logoFile);

      logo = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      if (fs.existsSync(logoFile.path)) fs.unlinkSync(logoFile.path);
    }

    // Upload banner
    if (bannerFile) {
      const result = await uploadToCloudinary(bannerFile);

      bannerImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      if (fs.existsSync(bannerFile.path)) fs.unlinkSync(bannerFile.path);
    }

    // Upload culture photos
    if (req.files?.culturePhotos) {
      for (let file of req.files.culturePhotos) {
        const result = await uploadToCloudinary(file);

        culturePhotos.push({
          url: result.secure_url,
          public_id: result.public_id,
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const company = await Company.create({
      ...req.body,
      userId,
      logo,
      bannerImage,
      culturePhotos,
    });

    return res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get My Company
// =================================================================================
export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.user._id });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get All Companies (Public) & Get Single Company
// =================================================================================
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate("userId", "name email");

    return res.json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Get Single Company (Public)
// =================================================================================
export const getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).populate(
      "userId",
      "name email",
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Update Company
// =================================================================================
export const updateCompany = async (req, res) => {
  try {
    const {
      companyName,
      website,
      industry,
      companySize,
      foundedYear,
      city,
      state,
      country,
      about,
      whyJoinUs,
    } = req.body;

    const logoFile = req.files?.logo?.[0];
    const bannerFile = req.files?.bannerImage?.[0];

    let logo = null;
    let bannerImage = null;
    let culturePhotos = [];

    // Upload logo
    if (logoFile) {
      const result = await uploadToCloudinary(logoFile);

      logo = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      if (fs.existsSync(logoFile.path)) fs.unlinkSync(logoFile.path);
    }

    // Upload banner
    if (bannerFile) {
      const result = await uploadToCloudinary(bannerFile);

      bannerImage = {
        url: result.secure_url,
        public_id: result.public_id,
      };

      if (fs.existsSync(bannerFile.path)) fs.unlinkSync(bannerFile.path);
    }

    // Upload culture photos
    if (req.files?.culturePhotos) {
      for (let file of req.files.culturePhotos) {
        const result = await uploadToCloudinary(file);

        culturePhotos.push({
          url: result.secure_url,
          public_id: result.public_id,
        });

        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const company = await Company.findOneAndUpdate(
      { userId: req.user._id },
      {
        ...(companyName && { companyName }),
        ...(website && { website }),
        ...(industry && { industry }),
        ...(companySize && { companySize }),
        ...(foundedYear && { foundedYear }),
        ...(city && { city }),
        ...(state && { state }),
        ...(country && { country }),
        ...(about && { about }),
        ...(whyJoinUs && { whyJoinUs }),
        ...(logo && { logo }),
        ...(bannerImage && { bannerImage }),
        ...(culturePhotos.length > 0 && { culturePhotos }),
      },
      { new: true },
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    return res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =================================================================================
//    Delete Company
// =================================================================================
// Employer deletes their own company  →  DELETE /api/company/me
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findOne({
      _id: req.params.companyId,
      userId: req.user._id,
    });

    if (company?.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Company already deleted" });
    }

    if (!company?._id) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    await company.softDelete(req.user._id);
    return res.json({ success: true, message: "Company deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =================================================================================
//    Restore Company
// =================================================================================
export const restoreCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.companyId);

    if (company.isDeleted === false) {
      return res
        .status(404)
        .json({ success: false, message: "Company is not deleted" });
    }

    if (!company || !company.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "No deleted company found" });
    }

    await company.restore();

    return res.json({
      success: true,
      message: "Company restored",
      data: company,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
