import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key_image,
  api_secret: process.env.api_secret_image,
});

/**
 * Cloudinary storage for both images and CVs.
 *
 * `resource_type: "auto"` is required: the CV uploader accepts `.pdf`, `.doc` and
 * `.docx`, and without this Cloudinary treats every upload as an image — Word
 * files were rejected or mangled. `"auto"` lets Cloudinary pick `image` for
 * pictures and `raw` for documents.
 *
 * `allowed_formats` mirrors the multer fileFilter, so a wrong type is refused
 * before it reaches the bucket.
 */
export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: "auto",
    folder: "itjobs",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx"],
  },
});
