// src/api/v1/validators/cinema.validator.ts
import { Request, Response, NextFunction } from "express";
import { CommonStatus } from "../../../types/common.type";

// Kiểm tra ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Kiểm tra URL hợp lệ
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate tạo mới cinema
export const validateCreateCinema = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const {
      name,
      parentId,
      address,
      avatar,
      description,
      cityIds, // ✅ THAY ĐỔI: từ cityId thành cityIds
      status
    } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ 
        code: 400, 
        message: "Tên rạp chiếu không được để trống" 
      });
      return;
    }

    if (name.trim().length < 2) {
      res.status(400).json({ 
        code: 400, 
        message: "Tên rạp chiếu phải có ít nhất 2 ký tự" 
      });
      return;
    }

    if (name.trim().length > 100) {
      res.status(400).json({ 
        code: 400, 
        message: "Tên rạp chiếu không được vượt quá 100 ký tự" 
      });
      return;
    }

    // Validate parentId (optional)
    if (parentId && !isValidObjectId(parentId)) {
      res.status(400).json({ 
        code: 400, 
        message: "ID rạp cha không hợp lệ" 
      });
      return;
    }

    // Validate address
    if (!address || typeof address !== 'string' || !address.trim()) {
      res.status(400).json({ 
        code: 400, 
        message: "Địa chỉ rạp chiếu không được để trống" 
      });
      return;
    }

    if (address.trim().length < 10) {
      res.status(400).json({ 
        code: 400, 
        message: "Địa chỉ rạp chiếu phải có ít nhất 10 ký tự" 
      });
      return;
    }

    if (address.trim().length > 200) {
      res.status(400).json({ 
        code: 400, 
        message: "Địa chỉ rạp chiếu không được vượt quá 200 ký tự" 
      });
      return;
    }

    // Validate avatar
    if (!avatar || typeof avatar !== 'string' || !isValidUrl(avatar)) {
      res.status(400).json({ 
        code: 400, 
        message: "Link ảnh đại diện không hợp lệ" 
      });
      return;
    }

    // Validate description
    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ 
        code: 400, 
        message: "Mô tả rạp chiếu không được để trống" 
      });
      return;
    }

    if (description.trim().length < 20) {
      res.status(400).json({ 
        code: 400, 
        message: "Mô tả rạp chiếu phải có ít nhất 20 ký tự" 
      });
      return;
    }

    if (description.trim().length > 500) {
      res.status(400).json({ 
        code: 400, 
        message: "Mô tả rạp chiếu không được vượt quá 500 ký tự" 
      });
      return;
    }

    // ✅ THAY ĐỔI: Validate cityIds (mảng)
    if (!cityIds || !Array.isArray(cityIds) || cityIds.length === 0) {
      res.status(400).json({ 
        code: 400, 
        message: "Rạp chiếu phải thuộc ít nhất một thành phố" 
      });
      return;
    }

    for (const cityId of cityIds) {
      if (!isValidObjectId(cityId)) {
        res.status(400).json({ 
          code: 400, 
          message: "ID thành phố không hợp lệ" 
        });
        return;
      }
    }

    // Validate status (optional)
    if (status && !Object.values(CommonStatus).includes(status)) {
      res.status(400).json({ 
        code: 400, 
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(CommonStatus).join(', ')}` 
      });
      return;
    }

    // Làm sạch dữ liệu
    req.body.name = name.trim();
    req.body.address = address.trim();
    req.body.description = description.trim();

    next();
  } catch (error) {
    console.error("Cinema validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate cập nhật cinema
export const validateUpdateCinema = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const body = { ...req.body };

    // Loại bỏ các trường không được phép sửa
    const forbiddenFields = ['slug', 'createdAt', 'updatedAt'];
    forbiddenFields.forEach(field => delete body[field]);

    // Validate từng trường nếu có trong body
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        res.status(400).json({ 
          code: 400, 
          message: "Tên rạp chiếu không được để trống" 
        });
        return;
      }
      
      if (body.name.trim().length < 2 || body.name.trim().length > 100) {
        res.status(400).json({ 
          code: 400, 
          message: "Tên rạp chiếu phải có từ 2 đến 100 ký tự" 
        });
        return;
      }
      body.name = body.name.trim();
    }

    // Validate parentId (có thể null/undefined để xóa parent)
    if (body.parentId !== undefined && body.parentId !== null && body.parentId !== '') {
      if (!isValidObjectId(body.parentId)) {
        res.status(400).json({ 
          code: 400, 
          message: "ID rạp cha không hợp lệ" 
        });
        return;
      }
    }

    if (body.address !== undefined) {
      if (!body.address || typeof body.address !== 'string' || !body.address.trim()) {
        res.status(400).json({ 
          code: 400, 
          message: "Địa chỉ rạp chiếu không được để trống" 
        });
        return;
      }

      if (body.address.trim().length < 10 || body.address.trim().length > 200) {
        res.status(400).json({ 
          code: 400, 
          message: "Địa chỉ rạp chiếu phải có từ 10 đến 200 ký tự" 
        });
        return;
      }
      body.address = body.address.trim();
    }

    if (body.avatar !== undefined) {
      if (!isValidUrl(body.avatar)) {
        res.status(400).json({ 
          code: 400, 
          message: "Link ảnh đại diện không hợp lệ" 
        });
        return;
      }
    }

    if (body.description !== undefined) {
      if (!body.description || typeof body.description !== 'string' || !body.description.trim()) {
        res.status(400).json({ 
          code: 400, 
          message: "Mô tả rạp chiếu không được để trống" 
        });
        return;
      }

      if (body.description.trim().length < 20 || body.description.trim().length > 500) {
        res.status(400).json({ 
          code: 400, 
          message: "Mô tả rạp chiếu phải có từ 20 đến 500 ký tự" 
        });
        return;
      }
      body.description = body.description.trim();
    }

    // ✅ THAY ĐỔI: Validate cityIds (mảng)
    if (body.cityIds !== undefined) {
      if (!Array.isArray(body.cityIds) || body.cityIds.length === 0) {
        res.status(400).json({ 
          code: 400, 
          message: "Rạp chiếu phải thuộc ít nhất một thành phố" 
        });
        return;
      }

      for (const cityId of body.cityIds) {
        if (!isValidObjectId(cityId)) {
          res.status(400).json({ 
            code: 400, 
            message: "ID thành phố không hợp lệ" 
          });
          return;
        }
      }
    }

    if (body.status !== undefined && !Object.values(CommonStatus).includes(body.status)) {
      res.status(400).json({ 
        code: 400, 
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(CommonStatus).join(', ')}` 
      });
      return;
    }

    // Gán lại body đã lọc vào req.body
    req.body = body;

    next();
  } catch (error) {
    console.error("Cinema update validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};