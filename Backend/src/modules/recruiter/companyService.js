import Company from '../../entity/Company.js';
import { M3Error } from './m3Error.js';
import { validateCompanyInput } from './recruiterValidation.js';

const getCompany = async (recruiterId) => {
  const company = await Company.findOne({ recruiterId });
  if (!company) {
    throw new M3Error(404, 'COMPANY_NOT_FOUND', 'Create a company profile before managing drives');
  }
  return company;
};

const upsertCompany = async (recruiterId, body) => {
  const companyData = validateCompanyInput(body);

  return Company.findOneAndUpdate(
    { recruiterId },
    { $set: companyData, $setOnInsert: { recruiterId } },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
};

const CompanyService = { getCompany, upsertCompany };
export default CompanyService;
