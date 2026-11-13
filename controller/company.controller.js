import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AccountCompany from "../model/account-company.model.js";
import JobCompany from "../model/job.model.js";
import Job from "../model/job.model.js";
import CV from "../model/cv.model.js";
import City from "../model/city.model.js";
import { getCookieOptions } from "../helper/cookie.helper.js";

/**
 * Turns whatever the form posted into a clean list of technology names.
 *
 * The old code split on `", "` only, so `ReactJS,NodeJS,MongoDB` typed without
 * spaces became one entry. Splitting on the comma and trimming handles both, and
 * dropping empties keeps a trailing comma from creating a blank tag.
 */
const splitTechnologies = (value) =>
  `${value ?? ""}`
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const registerPost = async (req, res) => {
  const { companyName, password } = req.body;
  // Chuẩn hóa email để tránh trùng lặp do hoa/thường
  const email = `${req.body.email}`.toLowerCase().trim();

  const existAccount = await AccountCompany.findOne({
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

  const newAccount = new AccountCompany({
    companyName: companyName,
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

  const existAccount = await AccountCompany.findOne({
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
      role: "company",
    },
    `${process.env.JWT_SECRET}`,
    {
      algorithm: "HS256",
      expiresIn: "1d",
    }
  );

  res.cookie("token", token, getCookieOptions(24 * 60 * 60 * 1000));

  res.json({
    code: "success",
    message: "Đăng nhập thành công !",
  });
};

export const profilePatch = async (req, res) => {
  // Danh sách trường được phép cập nhật (chống mass-assignment)
  const fieldsAllow = [
    "companyName",
    "city",
    "address",
    "companyModel",
    "companyEmployees",
    "workingTime",
    "workOvertime",
    "description",
    "phone",
  ];

  const dataUpdate = {};
  for (const key of fieldsAllow) {
    if (req.body[key] !== undefined) {
      dataUpdate[key] = req.body[key];
    }
  }

  if (req.file) {
    dataUpdate.logo = req.file.path;
  }

  await AccountCompany.updateOne(
    {
      _id: req.account.id,
    },
    dataUpdate
  );

  res.json({
    code: "success",
    message: "Cập nhật thành công!",
  });
};

export const jobCreate = async (req, res) => {
  try {
    const dataJob = {
      companyId: req.account.id, // Luôn lấy theo token, không tin dữ liệu client gửi
      title: req.body.title,
      salaryMin: req.body.salaryMin ? parseInt(req.body.salaryMin) : 0,
      salaryMax: req.body.salaryMax ? parseInt(req.body.salaryMax) : 0,
      position: req.body.position,
      workingForm: req.body.workingForm,
      technologies: splitTechnologies(req.body.technologies),
      description: req.body.description,
      images: [],
    };

    // Xử lý mảng images
    if (req.files) {
      for (const file of req.files) {
        dataJob.images.push(file.path);
      }
    }

    const newRecord = new JobCompany(dataJob);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Tạo công việc thành công!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Không thể tạo công việc. Vui lòng thử lại!",
    });
  }
};

export const jobList = async (req, res) => {
  try {
    const find = {
      companyId: req.account.id,
    };
    const limitItems = 3;
    let page = 1;
    if (req.query.page) {
      const currentPage = parseInt(`${req.query.page}`);
      if (currentPage > 0) {
        page = currentPage;
      }
    }
    const totalRecord = await JobCompany.countDocuments(find);
    const totalPage = Math.ceil(totalRecord / limitItems);
    if (page > totalPage && totalPage !== 0) {
      page = totalPage;
    }
    const skip = (page - 1) * limitItems;
    const jobs = await JobCompany.find(find)
      .sort({
        createdAt: "desc",
      })
      .limit(limitItems)
      .skip(skip);

    const dataFinal = [];

    const city = await City.findOne({
      _id: req.account.city,
    });

    for (const item of jobs) {
      dataFinal.push({
        id: item.id,
        companyLogo: req.account.logo,
        title: item.title,
        companyName: req.account.companyName,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        companyCity: city?.name,
        technologies: item.technologies,
      });
    }

    res.json({
      code: "success",
      message: "Lấy danh sách công việc thành công!",
      jobs: dataFinal,
      totalPage: totalPage,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Không thể lấy danh sách công việc. Vui lòng thử lại!",
    });
  }
};

export const editJob = async (req, res) => {
  try {
    const id = req.params.id;

    const jobDetail = await JobCompany.findOne({
      _id: id,
      companyId: req.account.id,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    res.json({
      code: "success",
      message: "Thành công!",
      jobDetail: jobDetail,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const editJobPatch = async (req, res) => {
  try {
    const id = req.params.id;

    const jobDetail = await JobCompany.findOne({
      _id: id,
      companyId: req.account.id,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    const dataUpdate = {
      title: req.body.title,
      salaryMin: req.body.salaryMin ? parseInt(req.body.salaryMin) : 0,
      salaryMax: req.body.salaryMax ? parseInt(req.body.salaryMax) : 0,
      position: req.body.position,
      workingForm: req.body.workingForm,
      technologies: splitTechnologies(req.body.technologies),
      description: req.body.description,
      /* Keep the images already on the job. The previous version started from an
         empty array, so saving the form without uploading new pictures erased
         every image the employer had attached. */
      images: [...(jobDetail.images || [])],
    };

    // Ảnh mới được thêm vào sau ảnh cũ, không thay thế chúng
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        dataUpdate.images.push(file.path);
      }
    }

    await JobCompany.updateOne(
      {
        _id: id,
        companyId: req.account.id,
      },
      dataUpdate
    );

    res.json({
      code: "success",
      message: "Cập nhật thành công!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const deleteJobDel = async (req, res) => {
  try {
    const id = req.params.id;

    const jobDetail = await JobCompany.findOne({
      _id: id,
      companyId: req.account.id,
    });

    if (!jobDetail) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    await JobCompany.deleteOne({
      _id: id,
      companyId: req.account.id,
    });

    res.json({
      code: "success",
      message: "Đã xóa!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const list = async (req, res) => {
  let limitItems = 12;
  if (req.query.limitItems) {
    const limitQuery = parseInt(`${req.query.limitItems}`);
    // Chặn client truyền limitItems quá lớn gây quá tải server
    if (limitQuery > 0 && limitQuery <= 50) {
      limitItems = limitQuery;
    }
  }

  // pagination
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(`${req.query.page}`);
    if (currentPage > 0) {
      page = currentPage;
    }
  }
  /* This endpoint lists companies, so the count has to come from the company
     collection. Counting Job here produced a page count for the wrong entity:
     ten companies and zero jobs rendered "0 pages", while two companies and fifty
     jobs offered five pages that were all empty. */
  const totalRecord = await AccountCompany.countDocuments({});
  const totalPage = Math.ceil(totalRecord / limitItems);
  if (page > totalPage && totalPage !== 0) {
    page = totalPage;
  }
  const skip = (page - 1) * limitItems;

  const companyList = await AccountCompany.find({})
    .sort({
      createdAt: "desc",
    })
    .limit(limitItems)
    .skip(skip);

  const companyListFinal = [];

  for (const item of companyList) {
    const dataItemFinal = {
      id: item.id,
      logo: item.logo,
      companyName: item.companyName,
      cityName: "",
      totalJob: 0,
    };
    const city = await City.findOne({ _id: item.city });
    dataItemFinal.cityName = `${city?.name}`;

    const totalJob = await Job.countDocuments({ companyId: item.id });
    dataItemFinal.totalJob = totalJob;

    companyListFinal.push(dataItemFinal);
  }

  res.json({
    code: "success",
    message: "Thành công!",
    companyList: companyListFinal,
  });
};

export const detail = async (req, res) => {
  try {
    const id = req.params.id;

    const record = await AccountCompany.findOne({
      _id: id,
    });

    if (!record) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    // Thông tin công ty
    const companyDetail = {
      id: record.id,
      logo: record.logo,
      companyName: record.companyName,
      address: record.address,
      companyModel: record.companyModel,
      companyEmployees: record.companyEmployees,
      workingTime: record.workingTime,
      workOvertime: record.workOvertime,
      description: record.description,
    };

    // Danh sách việc làm
    const jobList = await Job.find({
      companyId: record.id,
    }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];

    const city = await City.findOne({
      _id: record.city,
    });

    for (const item of jobList) {
      dataFinal.push({
        id: item.id,
        companyLogo: record.logo,
        title: item.title,
        companyName: record.companyName,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        companyCity: city?.name,
        technologies: item.technologies,
      });
    }

    res.json({
      code: "success",
      message: "Thành công!",
      companyDetail: companyDetail,
      jobList: dataFinal,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const listCV = async (req, res) => {
  try {
    const companyId = req.account.id;

    const Listjobs = await Job.find({ companyId: companyId });
    const JobID = Listjobs.map((item) => item.id);
    const listCV = await CV.find({ jobId: { $in: JobID } }).sort({
      createdAt: "desc",
    });

    const dataFinal = [];

    for (const item of listCV) {
      const dataItemFinal = {
        id: item.id,
        jobTitle: "",
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        jobSalaryMin: 0,
        jobSalaryMax: 0,
        jobPosition: "",
        jobWorkingForm: "",
        viewed: item.viewed,
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
      }

      dataFinal.push(dataItemFinal);
    }

    res.json({
      code: "success",
      message: "Lấy danh sách CV thành công!",
      listCV: dataFinal,
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Có lỗi xảy ra!",
    });
  }
};

export const detailCV = async (req, res) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    const infoCV = await CV.findOne({
      _id: cvId,
    });

    if (!infoCV) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId,
    });

    if (!infoJob) {
      res.json({
        code: "error",
        message: "Không có quyền truy cập!",
      });
      return;
    }

    const dataFinalCV = {
      fullName: infoCV.fullName,
      email: infoCV.email,
      phone: infoCV.phone,
      fileCV: infoCV.fileCV,
    };

    const dataFinalJob = {
      id: infoJob.id,
      title: infoJob.title,
      salaryMin: infoJob.salaryMin,
      salaryMax: infoJob.salaryMax,
      position: infoJob.position,
      workingForm: infoJob.workingForm,
      technologies: infoJob.technologies,
    };

    // Cập nhật trạng thái thành đã xem
    await CV.updateOne(
      {
        _id: cvId,
      },
      {
        viewed: true,
      }
    );

    res.json({
      code: "success",
      message: "Thành công!",
      infoCV: dataFinalCV,
      infoJob: dataFinalJob,
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const changeStatusCVPatch = async (req, res) => {
  try {
    const companyId = req.account.id;
    const status = req.body.action;
    const cvId = req.body.id;

    // Chỉ cho phép 2 trạng thái hợp lệ
    if (!["approved", "rejected"].includes(status)) {
      res.json({
        code: "error",
        message: "Trạng thái không hợp lệ!",
      });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId,
    });

    if (!infoCV) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId,
    });

    if (!infoJob) {
      res.json({
        code: "error",
        message: "Không có quyền truy cập!",
      });
      return;
    }

    await CV.updateOne({ _id: cvId }, { status: status });
    res.json({ code: "success", message: "Thành công!" });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};

export const deleteCVDel = async (req, res) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    const infoCV = await CV.findOne({
      _id: cvId,
    });

    if (!infoCV) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId,
    });

    if (!infoJob) {
      res.json({
        code: "error",
        message: "Không có quyền truy cập!",
      });
      return;
    }

    await CV.deleteOne({
      _id: cvId,
    });

    res.json({
      code: "success",
      message: "Đã xóa!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Id không hợp lệ!",
    });
  }
};
