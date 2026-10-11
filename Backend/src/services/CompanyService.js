import Company from '../entity/Company.js'
import JobDrive from '../entity/JobDrive.js'
import { createError } from '../utils/errors.js'
import { applyUpdates, companyEditableFields } from '../helper.js'

export const getAllCompanies = () => Company.find()

export const createCompanyProfile = async (userId, data = {}) => {
    const { name, website, industry, description, logoUrl, contactEmail, contactPhone } = data

    const companyExists = await Company.exists({ recruiterId: userId })
    if (companyExists) throw createError('Company profile already exists', 409)
    if (typeof name !== 'string' || !name.trim()) throw createError('Company name is required')

    return Company.create({
        recruiterId: userId,
        name,
        website,
        industry,
        description,
        logoUrl,
        contactEmail,
        contactPhone
    })
}

export const updateCompanyProfile = async (company, data = {}) => {
    if (data.name !== undefined && (typeof data.name !== 'string' || !data.name.trim()))
        throw createError('Company name cannot be empty')

    applyUpdates(company, data, companyEditableFields)
    return company.save()
}

export const getCompanyById = async (companyId) => {
    const company = await Company.findById(companyId)
    if (!company) throw createError('Company does not exist', 404)

    return company
}

export const getCompanyByRecruiterId = async (recruiterId) => {
    const company = await Company.findOne({ recruiterId })
    if (!company) throw createError('Company profile does not exist', 404)

    return company
}

export const deleteCompanyProfile = async (company) => {
    const hasDrives = await JobDrive.exists({ companyId: company._id })
    if (hasDrives) throw createError('Company has job drives and cannot be deleted', 409)

    await company.deleteOne()
}
