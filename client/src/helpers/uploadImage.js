/**
 * Upload ảnh lên Cloudinary
 * @param {File} file - File ảnh từ input
 * @returns {Promise<string>} - Trả về link ảnh (secure_url)
 */
// ✅ Sử dụng environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000/api/v1";

export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload/image`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (data.url) return data.url;
  throw new Error("Upload failed");
};
