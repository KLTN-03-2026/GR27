import ComboFood from "../models/comboFood.model";

export const getAllComboFoods = async () => {
  return ComboFood.find({ deleted: false });
};