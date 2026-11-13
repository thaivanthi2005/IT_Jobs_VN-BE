import multer from "multer";
import * as storageImage from "../helper/cloudinary.helper.js";

// Danh sách định dạng ảnh được phép upload
const IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/jpg",
];

// Danh sách định dạng CV được phép upload
const CV_MIMETYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const createUploader = (allowedTypes, maxSizeMB) =>
  multer({
    storage: storageImage.storage,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024, // Giới hạn dung lượng file
      files: 8, // Tối đa 8 file / request
      fields: 30, // Tối đa 30 field text / request
      fieldSize: 100 * 1024, // Mỗi field text tối đa 100KB
    },
    fileFilter: (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }
      cb(new Error("Định dạng file không được phép!"));
    },
  });

// Ảnh: avatar, logo công ty, ảnh mô tả công việc (tối đa 5MB)
export const image_parser = createUploader(IMAGE_MIMETYPES, 5);

// CV: chỉ nhận pdf, doc, docx (tối đa 10MB)
export const cv_parser = createUploader(CV_MIMETYPES, 10);
