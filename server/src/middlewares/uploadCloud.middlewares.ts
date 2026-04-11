import uploadToCloudinary from "../helpers/uploadCloudinary";
import { Request, Response, NextFunction } from "express";
export const uploadSingle = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer); // THÊM AWAIT
    req.body[req.file.fieldname] = result;
  }
  next();
};

export const uploadFields = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  type MulterFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  };

  const files = req.files as { [fieldname: string]: MulterFile[] };
  console.log('files', files);
  for (const key in files) {
    req.body[key] = [];
    const array = files[key];
    for (const item of array) {
      try {
        const result = await uploadToCloudinary(item.buffer);
        req.body[key].push(result);
      } catch (error) {
        console.error(error);
      }
    }
  }

  next();
};
