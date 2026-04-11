import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME!,
  api_key: process.env.CLOUD_KEY!,
  api_secret: process.env.CLOUD_SECRET!,
});

// Hàm upload buffer lên Cloudinary
const streamUpload = (buffer: Buffer): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: process.env.CLOUDINARY_FOLDER,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET,
      }, 
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Export hàm chính
const uploadCloudinary = async (buffer: Buffer): Promise<string> => {
  const result = await streamUpload(buffer);
  return result.secure_url;
};

export default uploadCloudinary;
