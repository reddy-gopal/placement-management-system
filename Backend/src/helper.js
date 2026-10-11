import jwt from 'jsonwebtoken'
import Application from './entity/Application.js'
import Company from './entity/Company.js'
import JobDrive from './entity/JobDrive.js'
import { Role, ApplicationStatus, EmploymentType, OfferStatus } from './enum.js'
import { createError } from './utils/errors.js'

const MIN_OFFER_DAYS = 7

export const studentEditableFields = [
    'rollNumber',
    'branch',
    'graduationYear',
    'cgpa',
    'activeBacklogs',
    'skills',
    'resumeUrl'
]

export const companyEditableFields = [
    'name',
    'website',
    'industry',
    'description',
    'logoUrl',
    'contactEmail',
    'contactPhone'
]

export const applyUpdates = (doc, data, fields) => {
    for (const field of fields) {
        if (data[field] !== undefined) doc[field] = data[field]
    }
}

export const generateToken = (user) => {
    if (!process.env.JWT_SECRET) throw createError('JWT_SECRET is not configured', 500)

    return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES || '7d'
    })
}

export const userDtoHelper = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
})

export const emailHelper = (email) => {
    if (typeof email !== 'string' || !email.trim()) throw createError('Email is required')
    return email.trim().toLowerCase()
}

export const escapeRegex = (text) =>
    String(text)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getEligibilityIssues = (student, drive) => {
    if (!student) return ['Complete your student profile to check eligibility']

    const { minCgpa = 6.0, maxBacklogs = 0, allowedBranches = [] } = drive.eligibility || {}
    const issues = []

    if (student.cgpa < minCgpa) issues.push(`Requires CGPA >= ${minCgpa}; your CGPA is ${student.cgpa}`)
    if (student.activeBacklogs > maxBacklogs)
        issues.push(`Allows at most ${maxBacklogs} active backlogs; you have ${student.activeBacklogs}`)
    if (allowedBranches.length > 0 && !allowedBranches.includes(student.branch))
        issues.push(`Open to ${allowedBranches.join(', ')} only`)

    return issues
}

export const withEligibility = (drive, student) => {
    const ineligibilityReasons = getEligibilityIssues(student, drive)
    return { ...drive.toObject(), isEligible: ineligibilityReasons.length === 0, ineligibilityReasons }
}

export const validateDriveFields = (driveData, checkDeadline = true) => {
    const { title, description, packageLpa, location, employmentType, deadline, eligibility } = driveData
    const { minCgpa = 6.0, maxBacklogs = 0, allowedBranches = [] } = eligibility ?? {}

    const packageValue = Number(packageLpa)
    const deadlineDate = new Date(deadline)
    const cgpaValue = Number(minCgpa)
    const backlogsValue = Number(maxBacklogs)

    if (![title, description, location].every((value) => typeof value === 'string' && value.trim()))
        throw createError('title, description and location are required')
    if (packageLpa === null || packageLpa === '' || isNaN(packageValue) || packageValue < 0)
        throw createError('packageLpa must be a valid non-negative number')
    if (!Object.values(EmploymentType).includes(employmentType)) throw createError('Invalid employmentType')
    if (isNaN(deadlineDate)) throw createError('deadline must be a valid date')
    if (checkDeadline && deadlineDate <= new Date()) throw createError('deadline must be in the future')
    if (isNaN(cgpaValue) || cgpaValue < 0 || cgpaValue > 10) throw createError('minCgpa must be between 0 and 10')
    if (!Number.isInteger(backlogsValue) || backlogsValue < 0)
        throw createError('maxBacklogs must be a non-negative integer')
    if (
        !Array.isArray(allowedBranches) ||
        allowedBranches.some((branch) => typeof branch !== 'string' || !branch.trim())
    )
        throw createError('allowedBranches must be an array of branch names')

    return {
        title: title.trim(),
        description: description.trim(),
        packageLpa: packageValue,
        location: location.trim(),
        employmentType,
        deadline: deadlineDate,
        eligibility: {
            minCgpa: cgpaValue,
            maxBacklogs: backlogsValue,
            allowedBranches: allowedBranches.map((branch) => branch.trim())
        }
    }
}

export const canEditDrive = async (driveId, userId, role) => {
    if (![Role.RECRUITER, Role.ADMIN].includes(role))
        throw createError('Only recruiters and admins can manage drives', 403)

    const drive = await JobDrive.findById(driveId)
    if (!drive) throw createError('Drive not found', 404)

    if (role === Role.RECRUITER) {
        const company = await Company.findOne({ recruiterId: userId })
        if (!company || !company._id.equals(drive.companyId))
            throw createError('You can only manage drives belonging to your company', 403)
    }

    return drive
}

export const canChangeStatus = (from, to) => {
    if (from === ApplicationStatus.APPLIED)
        return to === ApplicationStatus.SHORTLISTED || to === ApplicationStatus.REJECTED
    if (from === ApplicationStatus.SHORTLISTED)
        return to === ApplicationStatus.SELECTED || to === ApplicationStatus.REJECTED

    return false
}

export const expireOverdueOffers = () =>
    Application.updateMany(
        {
            status: ApplicationStatus.SELECTED,
            'offer.status': OfferStatus.PENDING,
            'offer.deadline': { $lte: new Date() }
        },
        { $set: { status: ApplicationStatus.REJECTED, 'offer.status': OfferStatus.EXPIRED } }
    )

export const getOfferDeadline = (requestedDeadline) => {
    const minDeadline = new Date(Date.now() + MIN_OFFER_DAYS * 24 * 60 * 60 * 1000)
    if (!requestedDeadline) return minDeadline

    const requested = new Date(requestedDeadline)
    if (isNaN(requested)) throw createError('offerDeadline must be a valid date')

    return requested > minDeadline ? requested : minDeadline
}
