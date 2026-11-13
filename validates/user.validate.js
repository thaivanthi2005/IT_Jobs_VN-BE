import Joi from "joi";

export const registerPost = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().required().min(5).max(50).messages({
      "string.empty": "Vui lòng nhập họ tên!",
      "string.min": "Họ tên phải có ít nhất 5 ký tự!",
      "string.max": "Họ tên không được vượt quá 50 ký tự!",
    }),
    email: Joi.string().required().email().messages({
      "string.empty": "Vui lòng nhập email của bạn!",
      "string.email": "Email không đúng định dạng!",
    }),
    password: Joi.string()
      .required()
      .min(8)
      .max(72)
      .custom((value, helpers) => {
        if (!/[A-Z]/.test(value)) {
          return helpers.error("password.uppercase");
        }
        if (!/[a-z]/.test(value)) {
          return helpers.error("password.lowercase");
        }
        if (!/\d/.test(value)) {
          return helpers.error("password.number");
        }
        if (!/[@$!%*?&]/.test(value)) {
          return helpers.error("password.special");
        }
        return value;
      })
      .messages({
        "string.empty": "Vui lòng nhập mật khẩu!",
        "string.min": "Mật khẩu phải chứa ít nhất 8 ký tự!",
        "string.max": "Mật khẩu không được vượt quá 72 ký tự!",
        "password.uppercase": "Mật khẩu phải chứa ít nhất một chữ cái in hoa!",
        "password.lowercase": "Mật khẩu phải chứa ít nhất một chữ cái thường!",
        "password.number": "Mật khẩu phải chứa ít nhất một chữ số!",
        "password.special": "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!",
      }),
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

export const loginPost = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().required().email().messages({
      "string.empty": "Vui lòng nhập email của bạn!",
      "string.email": "Email không đúng định dạng!",
    }),
    /* Login only checks that a password was typed. The composition rules belong
       to registration: enforcing them here rejected correct passwords that
       happened to use a symbol outside [@$!%*?&] — a '#' or '_' locked the
       account out even though the hash matched. */
    password: Joi.string().required().messages({
      "string.empty": "Vui lòng nhập mật khẩu!",
    }),
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
