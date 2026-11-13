import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AccountUser from "../model/account-user.model.js";
import AccountCompany from "../model/account-company.model.js";
import Job from "../model/job.model.js";
import CV from "../model/cv.model.js";

export const registerPost = async (req, res) => {
  const { fullName, password } = req.body;
  // Chuẩn hóa email để tránh trùng lặp do hoa/thường
  const email = `${req.body.email}`.toLowerCase().trim();

  const existAccount = await AccountUser.findOne({
    email: email,
  });

  if (existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại",
    });
    return;
  }

  // Mã hóa mật khẩu bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPass = await bcrypt.hash(password, salt);

  const newAccount = new AccountUser({
    fullName: fullName,
    email: email,
    password: hashedPass,
  });

  await newAccount.save();

  res.json({
    code: "success",
    message: "Đăng ký thành công",
  });
};

export const loginPost = async (req, res) => {
  const { email, password } = req.body;

  const existAccount = await AccountUser.findOne({
    email: `${email}`.toLowerCase().trim(),
  });

  // Thông báo chung chung để tránh bị dò email tồn tại trong hệ thống
  const messageLoginFail = "Email hoặc mật khẩu không đúng !";

  if (!existAccount) {
    res.json({
      code: "error",
      message: messageLoginFail,
    });
    return;
  }

  const isPassValid = await bcrypt.compare(password, `${existAccount.password}`);
  if (!isPassValid) {
    res.json({
      code: "error",
      message: messageLoginFail,
    });
    return;
  }

  const token = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email,
      role: "user",
    },
    `${process.env.JWT_SECRET}`,
    {
      algorithm: "HS256",
      expiresIn: "1d",
    }
  );

  res.cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.json({
    code: "success",
    message: "Đăng nhập thành công !",
  });
};

export const Profile = async (req, res) => {
  try {
    // Chỉ cho phép cập nhật các trường hồ sơ, tránh ghi đè email/password/_id
    const dataUpdate = {
      fullName: req.body.fullName,
      phone: req.body.phone,
    };

    // Bỏ các trường không được gửi lên
    for (const key of Object.keys(dataUpdate)) {
      if (dataUpdate[key] === undefined) delete dataUpdate[key];
    }

    if (req.file) {
      dataUpdate.avatar = req.file.path;
    }

    await AccountUser.updateOne(
      {
        _id: req.account.id,
      },
      dataUpdate
    );

    res.json({
      code: "success",
      message: "Cập nhật thành công ",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Không thể cập nhật hồ sơ. Vui lòng thử lại!",
    });
  }
};

export const listCV = async (req, res) => {
  try {
    const userEmail = req.account.email;

    const listCV = await CV.find({
      email: userEmail,
    }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];

    for (const item of listCV) {
      const dataItemFinal = {
        id: item.id,
        jobTitle: "",
        companyName: "",
        jobSalaryMin: 0,
        jobSalaryMax: 0,
        jobPosition: "",
        jobWorkingForm: "",
        status: item.status,
      };

      const infoJob = await Job.findOne({
        _id: item.jobId,
      });

      if (infoJob) {
        dataItemFinal.jobTitle = `${infoJob.title}`;
        dataItemFinal.jobSalaryMin = parseInt(`${infoJob.salaryMin}`);
        dataItemFinal.jobSalaryMax = parseInt(`${infoJob.salaryMax}`);
        dataItemFinal.jobPosition = `${infoJob.position}`;
        dataItemFinal.jobWorkingForm = `${infoJob.workingForm}`;

        const infoCompany = await AccountCompany.findOne({
          _id: infoJob.companyId,
        });

        if (infoCompany) {
          dataItemFinal.companyName = `${infoCompany.companyName}`;
          dataFinal.push(dataItemFinal);
        }
      }
    }

    res.json({
      code: "success",
      message: "Lấy danh sách CV thành công!",
      listCV: dataFinal,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Không thể lấy danh sách CV. Vui lòng thử lại!",
    });
  }
};
