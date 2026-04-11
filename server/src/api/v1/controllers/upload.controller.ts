 
 import { Request, Response } from "express";
import uploadCloudinary from "../../../helpers/uploadCloudinary";

 export const index = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(req.body);
    res.json({
      location: req.body.file
    });
  } catch (error) {
    console.log('error', error);
  }
}

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const imageUrl = await uploadCloudinary(file.buffer);

    return res.json({ url: imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
};