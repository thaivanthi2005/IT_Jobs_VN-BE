import City from "../model/city.model.js";

export const list = async (req, res) => {
  const cityList = await City.find({});

  res.json({
    code: "success",
    message: "Lấy danh sách thành phố thành công!",
    cityList: cityList,
  });
};
