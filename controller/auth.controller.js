import jwt from "jsonwebtoken";
import AccountUser from "../model/account-user.model.js";
import AccountCompany from "../model/account-company.model.js";

export const check = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.json({
        code: "error",
        message: "Token không hợp lệ !",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const { id, email } = decoded;

    // USER
    const existAccountUser = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (existAccountUser) {
      const infoUser = {
        id: existAccountUser.id,
        fullName: existAccountUser.fullName,
        email: existAccountUser.email,
        avatar: existAccountUser.avatar,
        phone: existAccountUser.phone,
      };
      res.json({
        code: "success",
        message: "TOKEN HỢP LỆ",
        infoUser: infoUser,
      });
      return;
    }

    // COMPANY
    const existAccountCompany = await AccountCompany.findOne({
      _id: id,
      email: email,
    });

    if (existAccountCompany) {
      const infoCompany = {
        id: existAccountCompany.id,
        companyName: existAccountCompany.companyName,
        email: existAccountCompany.email,
        city: existAccountCompany.city,
        address: existAccountCompany.address,
        companyModel: existAccountCompany.companyModel,
        companyEmployees: existAccountCompany.companyEmployees,
        workingTime: existAccountCompany.workingTime,
        workOvertime: existAccountCompany.workOvertime,
        description: existAccountCompany.description,
        logo: existAccountCompany.logo,
        phone: existAccountCompany.phone,
      };
      res.json({
        code: "success",
        message: "TOKEN HỢP LỆ",
        infoCompany: infoCompany,
      });
      return;
    }

    if (!existAccountUser && !existAccountCompany) {
      res.clearCookie("token");
      res.json({
        code: "error",
        message: "Tài khoản không tồn tại !",
      });
      return;
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Có lỗi xảy ra !",
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({
    code: "success",
    message: "ĐĂNG XUẤT THÀNH CÔNG",
  });
};
