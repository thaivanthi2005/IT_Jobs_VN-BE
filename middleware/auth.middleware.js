import jwt from "jsonwebtoken";
import AccountUser from "../model/account-user.model.js";
import AccountCompany from "../model/account-company.model.js";
import { getCookieOptions } from "../helper/cookie.helper.js";

export const verifyTokenUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.json({
        code: "error",
        message: "Vui lòng gửi kèm TOKEN !",
      });
      return;
    }

    // Chỉ chấp nhận thuật toán HS256, tránh tấn công "alg: none"
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const { id, email } = decoded;

    const existAccountUser = await AccountUser.findOne({
      _id: id,
      email: email,
    });

    if (!existAccountUser) {
      res.json({
        code: "error",
        message: "TOKEN Không hợp lệ !",
      });
      return;
    }

    req.account = existAccountUser;
    next();
  } catch (error) {
    res.clearCookie("token", getCookieOptions());
    res.json({
      code: "error",
      message: "TOKEN Không hợp lệ !",
    });
  }
};

export const verifyTokenCompany = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.json({
        code: "error",
        message: "Vui lòng gửi kèm theo token!",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const { id, email } = decoded;

    const existAccount = await AccountCompany.findOne({
      _id: id,
      email: email,
    });

    if (!existAccount) {
      res.clearCookie("token", getCookieOptions());
      res.json({
        code: "error",
        message: "Token không hợp lệ!",
      });
      return;
    }

    req.account = existAccount;
    next();
  } catch (error) {
    res.clearCookie("token", getCookieOptions());
    res.json({
      code: "error",
      message: "Token không hợp lệ!",
    });
  }
};
