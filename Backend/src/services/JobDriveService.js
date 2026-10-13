import JobDrive from '../entity/JobDrive.js'
import Company from '../entity/Company.js'
import StudentProfile from '../entity/StudentProfile.js'
import Application from '../entity/Application.js'
import { Role, JobDriveStatus, EmploymentType, OfferStatus } from '../enum.js'
import { createError } from '../utils/errors.js'
import { withEligibility, validateDriveFields, canEditDrive, escapeRegex } from '../helper.js'
import { sendDriveUpdateEmail } from './EmailService.js'

export const createDrive = async (userId, role, driveData = {}) => {
    if (![Role.RECRUITER, Role.ADMIN].includes(role))
        throw createError('Only recruiters and admins can create drives', 403)

    let company

    if (role === Role.RECRUITER) {
        company = await Company.findOne({ recruiterId: userId })
        if (!company) throw createError('Create your company profile first', 404)
    } else {
        if (!driveData.companyId) throw createError('companyId is required for admin-created drives')

        company = await Company.findById(driveData.companyId)
        if (!company) throw createError('Company not found', 404)
    }

    const fields = validateDriveFields(driveData)

    return JobDrive.create({ ...fields, companyId: company._id, status: JobDriveStatus.OPEN })
}

export const getAllDrives = async (userId, role, query = {}) => {
    const { search, location, minPackage, employmentType, status, page = 1, limit = 10 } = query
    const filter = {}

    if (status && !Object.values(JobDriveStatus).includes(status)) throw createError('Invalid drive status')

    if (role === Role.STUDENT) {
        filter.status = JobDriveStatus.OPEN
        filter.deadline = { $gt: new Date() }
    } else if (role === Role.RECRUITER) {
        const company = await Company.findOne({ recruiterId: userId })
        if (!company) throw createError('Company not found', 404)

        filter.companyId = company._id
        if (status) filter.status = status
    } else if (role === Role.ADMIN) {
        if (status) filter.status = status
    } else {
        throw createError('Invalid role', 403)
    }

    if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' }
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' }

    if (minPackage !== undefined) {
        const min = Number(minPackage)
        if (isNaN(min) || min < 0) throw createError('Invalid minimum package')
        filter.packageLpa = { $gte: min }
    }

    if (employmentType) {
        if (!Object.values(EmploymentType).includes(employmentType)) throw createError('Invalid employment type')
        filter.employmentType = employmentType
    }

    const pageNumber = Math.max(1, Number(page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 10))

    const [drives, total] = await Promise.all([
        JobDrive.find(filter)
            .populate('companyId', 'name logoUrl industry')
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize),
        JobDrive.countDocuments(filter)
    ])

    let results = drives

    if (role === Role.STUDENT) {
        const student = await StudentProfile.findOne({ userId })
        results = drives.map((drive) => withEligibility(drive, student))
    }

    return { drives: results, total, page: pageNumber, limit: pageSize }
}

export const getDriveById = async (driveId, userId, role) => {
    const drive = await JobDrive.findById(driveId).populate('companyId', 'name logoUrl industry website')
    if (!drive) throw createError('Drive not found', 404)

    if (role === Role.STUDENT) {
        if (drive.status !== JobDriveStatus.OPEN || drive.deadline <= new Date())
            throw createError('Drive not found', 404)

        const student = await StudentProfile.findOne({ userId })
        return withEligibility(drive, student)
    }

    if (role === Role.RECRUITER) {
        const company = await Company.findOne({ recruiterId: userId })
        const ownsDrive = company && company._id.equals(drive.companyId._id)

        if (!ownsDrive && drive.status !== JobDriveStatus.OPEN)
            throw createError('You can only view drives belonging to your company', 403)
    } else if (role !== Role.ADMIN) {
        throw createError('Invalid role', 403)
    }

    return drive
}

export const updateDrive = async (driveId, userId, role, driveData) => {
    const drive = await canEditDrive(driveId, userId, role)

    if (drive.status === JobDriveStatus.CANCELLED) throw createError('A cancelled drive cannot be edited')
    if (!driveData || Object.keys(driveData).length === 0) throw createError('No fields to update')
    const current = drive.toObject()
    const fields = validateDriveFields(
        { ...current, ...driveData, eligibility: { ...current.eligibility, ...driveData.eligibility } },
        driveData.deadline !== undefined
    )

    drive.set(fields)
    const saved = await drive.save()

    // Notify registered applicants of drive updates
    ;(async () => {
        try {
            const applications = await Application.find({ driveId: drive._id }).populate({
                path: 'studentId',
                populate: { path: 'userId', select: 'name email' }
            })
            const company = await Company.findById(drive.companyId)
            const companyName = company?.name || 'Company'

            for (const app of applications) {
                const email = app.studentId?.userId?.email
                const studentName = app.studentId?.userId?.name
                if (email) {
                    await sendDriveUpdateEmail({
                        to: email,
                        studentName,
                        jobTitle: drive.title,
                        companyName,
                        updateMessage: `The details for this drive have been updated. The application deadline is now ${new Date(drive.deadline).toLocaleDateString()}.`
                    })
                }
            }
        } catch (err) {
            console.error('[EmailService] Failed to send drive update emails:', err.message)
        }
    })()

    return saved
}

export const updateDriveStatus = async (driveId, userId, role, status) => {
    if (![Role.RECRUITER, Role.ADMIN].includes(role))
        throw createError('You are not allowed to update drive status', 403)

    const allowedStatuses =
        role === Role.ADMIN
            ? [JobDriveStatus.OPEN, JobDriveStatus.CLOSED, JobDriveStatus.CANCELLED]
            : [JobDriveStatus.OPEN, JobDriveStatus.CLOSED]

    if (!allowedStatuses.includes(status)) throw createError(`Status must be ${allowedStatuses.join(' or ')}`)

    const drive = await canEditDrive(driveId, userId, role)
    if (drive.status === JobDriveStatus.CANCELLED) throw createError('A cancelled drive cannot be changed')

    drive.status = status
    const saved = await drive.save()

    if (status === JobDriveStatus.CANCELLED) {
        // Notify applicants if drive is cancelled
        ;(async () => {
            try {
                const applications = await Application.find({ driveId: drive._id }).populate({
                    path: 'studentId',
                    populate: { path: 'userId', select: 'name email' }
                })
                const company = await Company.findById(drive.companyId)
                const companyName = company?.name || 'Company'

                for (const app of applications) {
                    const email = app.studentId?.userId?.email
                    const studentName = app.studentId?.userId?.name
                    if (email) {
                        await sendDriveUpdateEmail({
                            to: email,
                            studentName,
                            jobTitle: drive.title,
                            companyName,
                            updateMessage: 'Notice: This placement drive has been cancelled by the recruitment cell.'
                        })
                    }
                }
            } catch (err) {
                console.error('[EmailService] Failed to send cancellation emails:', err.message)
            }
        })()
    }

    return saved
}

export const deleteDrive = async (driveId, role) => {
    if (role !== Role.ADMIN) throw createError('Only admins can delete drives', 403)

    const drive = await JobDrive.findById(driveId)
    if (!drive) throw createError('Drive not found', 404)

    const hasAcceptedOffer = await Application.exists({ driveId: drive._id, 'offer.status': OfferStatus.ACCEPTED })
    if (hasAcceptedOffer) throw createError('Drive has accepted offers and cannot be deleted', 409)

    await Application.deleteMany({ driveId: drive._id })
    await drive.deleteOne()

    return { message: 'Drive deleted successfully' }
}
