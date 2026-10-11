import * as CompanyService from '../services/CompanyService.js'

export const getCompany = (req, res) => {
    res.status(200).json({ success: true, company: req.company })
}

export const getAllCompanies = async (req, res) => {
    const companies = await CompanyService.getAllCompanies()
    res.status(200).json({ success: true, companies })
}

export const createCompany = async (req, res) => {
    const company = await CompanyService.createCompanyProfile(req.user.id, req.body)
    res.status(201).json({ success: true, message: 'Company profile created successfully', company })
}

export const updateCompany = async (req, res) => {
    const company = await CompanyService.updateCompanyProfile(req.company, req.body)
    res.status(200).json({ success: true, message: 'Company profile updated successfully', company })
}

export const getCompanyById = async (req, res) => {
    const company = await CompanyService.getCompanyById(req.params.companyId)
    res.status(200).json({ success: true, company })
}

export const getCompanyByRecruiter = async (req, res) => {
    const company = await CompanyService.getCompanyByRecruiterId(req.params.recruiterId)
    res.status(200).json({ success: true, company })
}

export const deleteCompany = async (req, res) => {
    await CompanyService.deleteCompanyProfile(req.company)
    res.status(200).json({ success: true, message: 'Company profile deleted successfully' })
}
