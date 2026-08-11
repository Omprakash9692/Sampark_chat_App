import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const isImage = (req, file, cb) =>
  ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"), false);

const isSafeFile = (req, file, cb) =>
  [".exe", ".bat", ".sh", ".js", ".vbs", ".scr"].includes(path.extname(file.originalname).toLowerCase())
    ? cb(new Error("Dangerous file types are not allowed"), false)
    : cb(null, true);

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: isImage });
export const chatUpload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter: isSafeFile });




