import uploadCloudinary from "../../../helpers/uploadCloudinary";

export const uploadImage = async (fileBuffer: Buffer): Promise<string> => {
  return uploadCloudinary(fileBuffer);
};