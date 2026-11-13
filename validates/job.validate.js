import Joi from "joi";

export const applyPost = (req, res, next) => {
  const schema = Joi.object({
    jobId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.empty": "Không tìm thấy công việc này!",
        "string.pattern.base": "Id công việc không hợp lệ!",
      }),
    fullName: Joi.string()
      .required()
      .min(5)
      .max(50)
      .messages({
        "string.empty": "Vui lòng nhập họ tên!",
        "string.min": "Họ tên phải có ít nhất 5 ký tự!",
        "string.max": "Họ tên không được vượt quá 50 ký tự!",
      }),
    email: Joi.string()
      .required()
      .email()
      .messages({
        "string.empty": "Vui lòng nhập email!",
        "string.email": "Email không đúng định dạng!",
      }),
    phone: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/g.test(value)) {
          return helpers.error("phone.invalid");
        }
        return value;
      })
      .messages({
        "string.empty": "Vui lòng nhập số điện thoại!",
        "phone.invalid": "Số điện thoại không đúng định dạng!",
      }),
    fileCV: Joi.string().allow(""),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    const errorMessage = error.details[0].message;
    res.json({
      code: "error",
      message: errorMessage,
    });
    return;
  }

  next();
};

// Dùng chung cho tạo mới và cập nhật tin tuyển dụng
export const jobPost = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string()
      .required()
      .min(5)
      .max(200)
      .messages({
        "string.empty": "Vui lòng nhập tên công việc!",
        "string.min": "Tên công việc phải có ít nhất 5 ký tự!",
        "string.max": "Tên công việc không được vượt quá 200 ký tự!",
      }),
    salaryMin: Joi.alternatives()
      .try(Joi.number().min(0), Joi.string().allow(""))
      .messages({
        "number.base": "Lương tối thiểu phải là số!",
        "number.min": "Lương tối thiểu không được âm!",
      }),
    salaryMax: Joi.alternatives()
      .try(Joi.number().min(0), Joi.string().allow(""))
      .messages({
        "number.base": "Lương tối đa phải là số!",
        "number.min": "Lương tối đa không được âm!",
      }),
    position: Joi.string().required().max(100).messages({
      "string.empty": "Vui lòng nhập cấp bậc!",
      "string.max": "Cấp bậc không được vượt quá 100 ký tự!",
    }),
    workingForm: Joi.string().required().max(100).messages({
      "string.empty": "Vui lòng nhập hình thức làm việc!",
      "string.max": "Hình thức làm việc không được vượt quá 100 ký tự!",
    }),
    technologies: Joi.string().allow("").max(500).messages({
      "string.max": "Danh sách công nghệ không được vượt quá 500 ký tự!",
    }),
    description: Joi.string().allow("").max(20000).messages({
      "string.max": "Mô tả không được vượt quá 20000 ký tự!",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    res.json({
      code: "error",
      message: error.details[0].message,
    });
    return;
  }

  next();
};
