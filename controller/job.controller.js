import Job from "../model/job.model.js";
import AccountCompany from "../model/account-company.model.js";
import CV from "../model/cv.model.js";

export const detail = async (req, res) => {
  try {
    const id = req.params.id;

    const record = await Job.findOne({
      _id: id,
    });

    if (!record) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!",
      });
      return;
    }

    const jobDetail = {
      id: record.id,
      title: record.title,
      companyName: "",
      salaryMin: record.salaryMin,
      salaryMax: record.salaryMax,
      images: record.images,
      position: record.position,
      workingForm: record.workingForm,
      companyAddress: "",
      technologies: record.technologies,
      description: record.description,
      companyLogo: "",
      companyId: record.companyId,
      companyModel: "",
      companyEmployees: "",
      companyWorkingTime: "",
      companyWorkOvertime: "",
    };

    const companyInfo = await AccountCompany.findOne({
      _id: record.companyId,
    });

    if (companyInfo) {
      jobDetail.companyName = `${companyInfo.companyName}`;
      jobDetail.companyAddress = `${companyInfo.address}`;
      jobDetail.companyLogo = `${companyInfo.logo}`;
      jobDetail.companyModel = `${companyInfo.companyModel}`;
      jobDetail.companyEmployees = `${companyInfo.companyEmployees}`;
      jobDetail.companyWorkingTime = `${companyInfo.workingTime}`;
      jobDetail.companyWorkOvertime = `${companyInfo.workOvertime}`;
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

export const applyPost = async (req, res) => {
  try {
    // Chỉ lưu các trường cần thiết, tránh client gửi kèm field lạ (vd: status, viewed)
    const dataCV = {
      jobId: req.body.jobId,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      fileCV: req.file ? req.file.path : "",
    };

    const existJob = await Job.findOne({ _id: dataCV.jobId });
    if (!existJob) {
      res.json({
        code: "error",
        message: "Không tìm thấy công việc này!",
      });
      return;
    }

    const newRecord = new CV(dataCV);
    await newRecord.save();

    res.json({
      code: "success",
      message: "Đã gửi CV thành công!",
    });
  } catch (error) {
    console.error(error);
    res.json({
      code: "error",
      message: "Không thể gửi CV. Vui lòng thử lại!",
    });
  }
};
