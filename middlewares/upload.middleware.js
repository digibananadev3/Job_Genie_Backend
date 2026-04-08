import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: "uploads/temp",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// =============================================================================
//  Generic upload — images + PDF, 5 MB (used as a general-purpose uploader)
// =============================================================================
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: jpeg, png, webp, pdf"), false);
    }
  },
});

// =============================================================================
//  Image-only upload — jpeg / jpg / png / webp, 5 MB
// =============================================================================
export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);

    cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed"), false);
  },
});

// =============================================================================
//  PDF-only upload — 10 MB (resumes)
// =============================================================================
export const resumeUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      path.extname(file.originalname).toLowerCase() === ".pdf"
    ) {
      return cb(null, true);
    }
    cb(new Error("Only PDF files are allowed"), false);
  },
});

export default upload;