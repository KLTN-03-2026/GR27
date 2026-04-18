import Category from "../models/category.model";

export const getAllCategories = async () => {
  const categories = await Category.find();
  if (!categories || categories.length === 0) {
    throw { status: 404, message: "Không tìm thấy danh mục" };
  }
  return categories;
};