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

// Validate tạo mới film
export const validateCreateFilm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const {
      title,
      categoryIds,
      actors,
      directors,
      releaseDate,
      availableFormats,
      duration,
      ageRating,
      trailer,
      thumbnail,
      filmLanguage,
      subtitles,
      description,
      status,
      isTrending,
    } = req.body;

    // Validate title
    if (!title || typeof title !== "string" || !title.trim()) {
      res.status(400).json({
        code: 400,
        message: "Tiêu đề phim không được để trống",
      });
      return;
    }

    if (title.trim().length < 2) {
      res.status(400).json({
        code: 400,
        message: "Tiêu đề phim phải có ít nhất 2 ký tự",
      });
      return;
    }

    if (title.trim().length > 200) {
      res.status(400).json({
        code: 400,
        message: "Tiêu đề phim không được vượt quá 200 ký tự",
      });
      return;
    }

    // Validate categoryIds
    if (
      !categoryIds ||
      !Array.isArray(categoryIds) ||
      categoryIds.length === 0
    ) {
      res.status(400).json({
        code: 400,
        message: "Phim phải thuộc ít nhất một danh mục",
      });
      return;
    }

    for (const categoryId of categoryIds) {
      if (!isValidObjectId(categoryId)) {
        res.status(400).json({
          code: 400,
          message: "ID danh mục không hợp lệ",
        });
        return;
      }
    }

    // Validate actors
    if (!actors || !Array.isArray(actors) || actors.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Phim phải có ít nhất một diễn viên",
      });
      return;
    }

    for (const actor of actors) {
      if (!actor || typeof actor !== "string" || !actor.trim()) {
        res.status(400).json({
          code: 400,
          message: "Tên diễn viên không được để trống",
        });
        return;
      }
      if (actor.trim().length > 100) {
        res.status(400).json({
          code: 400,
          message: "Tên diễn viên không được vượt quá 100 ký tự",
        });
        return;
      }
    }

    // Validate directors
    if (!directors || !Array.isArray(directors) || directors.length === 0) {
      res.status(400).json({
        code: 400,
        message: "Phim phải có ít nhất một đạo diễn",
      });
      return;
    }

    for (const director of directors) {
      if (!director || typeof director !== "string" || !director.trim()) {
        res.status(400).json({
          code: 400,
          message: "Tên đạo diễn không được để trống",
        });
        return;
      }
      if (director.trim().length > 100) {
        res.status(400).json({
          code: 400,
          message: "Tên đạo diễn không được vượt quá 100 ký tự",
        });
        return;
      }
    }

    // Validate releaseDate
    if (!releaseDate) {
      res.status(400).json({
        code: 400,
        message: "Ngày phát hành không được để trống",
      });
      return;
    }

    const releaseDateObj = new Date(releaseDate);
    if (isNaN(releaseDateObj.getTime())) {
      res.status(400).json({
        code: 400,
        message: "Ngày phát hành không hợp lệ",
      });
      return;
    }

    // Validate availableFormats
    if (
      !availableFormats ||
      !Array.isArray(availableFormats) ||
      availableFormats.length === 0
    ) {
      res.status(400).json({
        code: 400,
        message: "Phim phải có ít nhất một định dạng chiếu",
      });
      return;
    }

    const validFormats = ["2D", "3D", "IMAX", "4DX"];
    for (const format of availableFormats) {
      if (!validFormats.includes(format)) {
        res.status(400).json({
          code: 400,
          message: `Định dạng chiếu không hợp lệ. Chỉ chấp nhận: ${validFormats.join(
            ", "
          )}`,
        });
        return;
      }
    }

    // Validate duration
    if (!duration || typeof duration !== "number" || duration <= 0) {
      res.status(400).json({
        code: 400,
        message: "Thời lượng phim phải là số dương (tính bằng phút)",
      });
      return;
    }

    if (duration < 30 || duration > 300) {
      res.status(400).json({
        code: 400,
        message: "Thời lượng phim phải từ 30 đến 300 phút",
      });
      return;
    }

    // Validate ageRating
    if (!ageRating || typeof ageRating !== "string") {
      res.status(400).json({
        code: 400,
        message: "Phân loại độ tuổi không được để trống",
      });
      return;
    }

    const validAgeRatings = ["P", "K", "T13", "T16", "T18", "C"];
    if (!validAgeRatings.includes(ageRating)) {
      res.status(400).json({
        code: 400,
        message: `Phân loại độ tuổi không hợp lệ. Chỉ chấp nhận: ${validAgeRatings.join(
          ", "
        )}`,
      });
      return;
    }

    // Validate trailer (optional)
    if (
      trailer &&
      (!isValidUrl(trailer) ||
        (!trailer.includes("youtube.com") && !trailer.includes("youtu.be")))
    ) {
      res.status(400).json({
        code: 400,
        message:
          "Link trailer phải là URL YouTube hợp lệ (youtube.com hoặc youtu.be)",
      });
      return;
    }

    // Validate thumbnail
    if (!thumbnail || typeof thumbnail !== "string" || !isValidUrl(thumbnail)) {
      res.status(400).json({
        code: 400,
        message: "Link ảnh thumbnail không hợp lệ",
      });
      return;
    }

    // Validate language
    if (
      !filmLanguage ||
      typeof filmLanguage !== "string" ||
      !filmLanguage.trim()
    ) {
      res.status(400).json({
        code: 400,
        message: "Ngôn ngữ phim không được để trống",
      });
      return;
    }

    // Validate subtitles
    if (!subtitles || typeof subtitles !== "string" || !subtitles.trim()) {
      res.status(400).json({
        code: 400,
        message: "Phụ đề không được để trống",
      });
      return;
    }

    // Validate description
    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      res.status(400).json({
        code: 400,
        message: "Mô tả phim không được để trống",
      });
      return;
    }

    if (description.trim().length < 20) {
      res.status(400).json({
        code: 400,
        message: "Mô tả phim phải có ít nhất 20 ký tự",
      });
      return;
    }

    if (description.trim().length > 1000) {
      res.status(400).json({
        code: 400,
        message: "Mô tả phim không được vượt quá 1000 ký tự",
      });
      return;
    }

    // Validate status (optional)
    if (status && !Object.values(CommonStatus).includes(status)) {
      res.status(400).json({
        code: 400,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(
          CommonStatus
        ).join(", ")}`,
      });
      return;
    }

    // Validate isTrending (optional)
    if (isTrending !== undefined && typeof isTrending !== "boolean") {
      res.status(400).json({
        code: 400,
        message: "isTrending phải là boolean",
      });
      return;
    }

    // Làm sạch dữ liệu
    req.body.title = title.trim();
    req.body.actors = actors.map((actor: string) => actor.trim());
    req.body.directors = directors.map((director: string) => director.trim());
    req.body.filmLanguage = filmLanguage.trim();
    req.body.subtitles = subtitles.trim();
    req.body.description = description.trim();

    next();
  } catch (error) {
    console.error("Film validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Validate cập nhật film
export const validateUpdateFilm = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const body = { ...req.body };

    // Loại bỏ các trường không được phép sửa
    const forbiddenFields = ["slug", "createdAt", "updatedAt"];
    forbiddenFields.forEach((field) => delete body[field]);

    // Validate từng trường nếu có trong body
    if (body.title !== undefined) {
      if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
        res.status(400).json({
          code: 400,
          message: "Tiêu đề phim không được để trống",
        });
        return;
      }

      if (body.title.trim().length < 2 || body.title.trim().length > 200) {
        res.status(400).json({
          code: 400,
          message: "Tiêu đề phim phải có từ 2 đến 200 ký tự",
        });
        return;
      }
      body.title = body.title.trim();
    }

    if (body.categoryIds !== undefined) {
      if (!Array.isArray(body.categoryIds) || body.categoryIds.length === 0) {
        res.status(400).json({
          code: 400,
          message: "Phim phải thuộc ít nhất một danh mục",
        });
        return;
      }

      for (const categoryId of body.categoryIds) {
        if (!isValidObjectId(categoryId)) {
          res.status(400).json({
            code: 400,
            message: "ID danh mục không hợp lệ",
          });
          return;
        }
      }
    }

    if (body.duration !== undefined) {
      if (typeof body.duration !== "number" || body.duration <= 0) {
        res.status(400).json({
          code: 400,
          message: "Thời lượng phim phải là số dương",
        });
        return;
      }

      if (body.duration < 30 || body.duration > 300) {
        res.status(400).json({
          code: 400,
          message: "Thời lượng phim phải từ 30 đến 300 phút",
        });
        return;
      }
    }

    if (body.ageRating !== undefined) {
      const validAgeRatings = ["P", "K", "T13", "T16", "T18", "C"];
      if (!validAgeRatings.includes(body.ageRating)) {
        res.status(400).json({
          code: 400,
          message: `Phân loại độ tuổi không hợp lệ. Chỉ chấp nhận: ${validAgeRatings.join(
            ", "
          )}`,
        });
        return;
      }
    }

    if (body.trailer !== undefined && body.trailer) {
      if (
        !isValidUrl(body.trailer) ||
        (!body.trailer.includes("youtube.com") &&
          !body.trailer.includes("youtu.be"))
      ) {
        res.status(400).json({
          code: 400,
          message:
            "Link trailer phải là URL YouTube hợp lệ (youtube.com hoặc youtu.be)",
        });
        return;
      }
    }

    if (body.thumbnail !== undefined) {
      if (!isValidUrl(body.thumbnail)) {
        res.status(400).json({
          code: 400,
          message: "Link ảnh thumbnail không hợp lệ",
        });
        return;
      }
    }

    if (body.description !== undefined) {
      if (
        !body.description ||
        typeof body.description !== "string" ||
        !body.description.trim()
      ) {
        res.status(400).json({
          code: 400,
          message: "Mô tả phim không được để trống",
        });
        return;
      }

      if (
        body.description.trim().length < 20 ||
        body.description.trim().length > 1000
      ) {
        res.status(400).json({
          code: 400,
          message: "Mô tả phim phải có từ 20 đến 1000 ký tự",
        });
        return;
      }
      body.description = body.description.trim();
    }

    if (
      body.status !== undefined &&
      !Object.values(CommonStatus).includes(body.status)
    ) {
      res.status(400).json({
        code: 400,
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${Object.values(
          CommonStatus
        ).join(", ")}`,
      });
      return;
    }

    if (body.isTrending !== undefined && typeof body.isTrending !== "boolean") {
      res.status(400).json({
        code: 400,
        message: "isTrending phải là boolean",
      });
      return;
    }

    // Gán lại body đã lọc vào req.body
    req.body = body;

    next();
  } catch (error) {
    console.error("Film update validation error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
