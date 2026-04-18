import City from "../models/city.model";

export const getAllCities = async () => {
  const cities = await City.find();
  if (!cities || cities.length === 0) {
    throw { status: 404, message: "Không tìm thấy thành phố" };
  }
  return cities;
};

export const getCityById = async (id: string) => {
  const city = await City.findById(id);
  if (!city) throw { status: 404, message: "Không tìm thấy tỉnh/thành phố" };
  return city;
};