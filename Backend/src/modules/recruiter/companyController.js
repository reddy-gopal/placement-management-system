import CompanyService from './companyService.js';
import { sendM3Error } from './m3Error.js';

export const getMyCompany = async (req, res) => {
  try {
    const company = await CompanyService.getCompany(req.user.id);
    return res.status(200).json({ success: true, data: { company } });
  } catch (error) {
    return sendM3Error(res, error);
  }
};

export const upsertMyCompany = async (req, res) => {
  try {
    const company = await CompanyService.upsertCompany(req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Company profile saved successfully',
      data: { company }
    });
  } catch (error) {
    return sendM3Error(res, error);
  }
};
