import AccountCompany from "../model/account-company.model.js";
import City from "../model/city.model.js";
import Job from "../model/job.model.js";

// Escape ký tự đặc biệt của Regex để chống ReDoS / Regex Injection
const escapeRegex = (text) => `${text}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const search = async (req, res) => {
  const dataFinal = [];
  let totalPage = 0;
  let totalRecord = 0;

  /* The query object is never empty in practice (Next sends at least `page`), but
     the old guard meant a bare `/search` returned an empty list even though the
     database was full. Building the filter unconditionally and letting an empty
     filter match everything is both simpler and correct. */
  {
    const find = {};

    // language
    if (req.query.language) {
      find.technologies = req.query.language;
    }

    // City
    if (req.query.city) {
      const city = await City.findOne({
        name: req.query.city,
      });

      if (city) {
        const listAccountCompanyInCity = await AccountCompany.find({
          city: city.id,
        });

        const listIdAccountCompany = listAccountCompanyInCity.map(
          (item) => item.id
        );

        find.companyId = { $in: listIdAccountCompany };
      }
    }

    // company
    if (req.query.company) {
      const accountCompany = await AccountCompany.findOne({
        companyName: req.query.company,
      });

      /* Combine with a city filter instead of overwriting it. The old assignment
         replaced `find.companyId` wholesale, so filtering by city *and* company
         silently dropped the city condition. */
      const companyId = accountCompany?.id;
      if (find.companyId?.$in) {
        find.companyId = companyId
          ? { $in: find.companyId.$in.filter((id) => `${id}` === `${companyId}`) }
          : { $in: find.companyId.$in };
      } else {
        find.companyId = companyId;
      }
    }

    // keyword
    if (req.query.keyword) {
      const keyword = `${req.query.keyword}`.slice(0, 100); // Giới hạn độ dài từ khóa
      const keywordRegex = new RegExp(escapeRegex(keyword), "i");
      find["$or"] = [
        { title: keywordRegex },
        { technologies: keywordRegex },
      ];
    }

    // position
    if (req.query.position) {
      find.position = req.query.position;
    }

    // workingForm
    if (req.query.workingForm) {
      find.workingForm = req.query.workingForm;
    }

    // pagination
    /* Read the page size from the query. It used to be hard-coded to 3, so the
       home page asking for 6 featured jobs could only ever receive 3. */
    let limitItems = 6;
    if (req.query.limitItems) {
      const requested = parseInt(`${req.query.limitItems}`, 10);
      if (Number.isFinite(requested) && requested > 0 && requested <= 50) {
        limitItems = requested;
      }
    }
    let page = 1;
    if (req.query.page) {
      const currentPage = parseInt(`${req.query.page}`);
      if (currentPage && currentPage > 0) page = currentPage;
      else page = 1;
    }

    totalRecord = await Job.countDocuments(find);
    totalPage = Math.ceil(totalRecord / limitItems);

    if (page > totalPage && totalPage !== 0) {
      page = totalPage;
    }
    const skip = (page - 1) * limitItems;

    const jobs = await Job.find(find)
      .sort({ createdAt: "desc" })
      .limit(limitItems)
      .skip(skip);

    for (const item of jobs) {
      const itemFinal = {
        id: item.id,
        companyLogo: "",
        title: item.title,
        companyName: "",
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        companyCity: "",
        technologies: item.technologies,
      };

      const companyInfo = await AccountCompany.findOne({
        _id: item.companyId,
      });

      if (companyInfo) {
        itemFinal.companyLogo = `${companyInfo.logo}`;
        itemFinal.companyName = `${companyInfo.companyName}`;

        const citys = await City.findOne({
          _id: companyInfo.city,
        });
        itemFinal.companyCity = `${citys?.name}`;
      }

      dataFinal.push(itemFinal);
    }
  }

  res.json({
    code: "success",
    message: "Thành công!",
    jobs: dataFinal,
    totalPage: totalPage,
    totalRecord: totalRecord,
  });
};
