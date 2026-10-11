import Application from '../entity/Application.js'
import StudentProfile from '../entity/StudentProfile.js'
import JobDrive from '../entity/JobDrive.js'
import Company from '../entity/Company.js'
import { Role, ApplicationStatus, JobDriveStatus, OfferStatus } from '../enum.js'
import { createError } from '../utils/errors.js'
import { canChangeStatus, expireOverdueOffers, getEligibilityIssues, getOfferDeadline } from '../helper.js'

export const applyForDrive = async (student, driveId) => {
    if (!driveId) throw createError('driveId is required')
    if (student.isPlaced) throw createError('You have already accepted an offer', 403)

    const drive = await JobDrive.findById(driveId)
    if (!drive) throw createError('Drive not found', 404)
    if (drive.status !== JobDriveStatus.OPEN) throw createError('This drive is not open')
    if (drive.deadline < new Date()) throw createError('Application deadline has passed')

    const issues = getEligibilityIssues(student, drive)
    if (issues.length > 0) throw createError(`Not eligible: ${issues.join('; ')}`, 403)

    if (!student.resumeUrl) throw createError('Please upload your resume before applying')

    const alreadyApplied = await Application.exists({ driveId: drive._id, studentId: student._id })
    if (alreadyApplied) throw createError('You have already applied for this drive', 409)

    return Application.create({
        driveId: drive._id,
        studentId: student._id,
        resumeUrl: student.resumeUrl,
        status: ApplicationStatus.APPLIED
    })
}

export const getMyApplications = async (student) => {
    await expireOverdueOffers()

    return Application.find({ studentId: student._id })
        .populate({ path: 'driveId', populate: { path: 'companyId', select: 'name logoUrl' } })
        .sort({ createdAt: -1 })
}

export const getDriveApplications = async (driveId, userId, role) => {
    const drive = await JobDrive.findById(driveId)
    if (!drive) throw createError('Drive not found', 404)

    if (role === Role.RECRUITER) {
        const ownsDrive = await Company.exists({ _id: drive.companyId, recruiterId: userId })
        if (!ownsDrive) throw createError('You are not authorized to view these applications', 403)
    } else if (role !== Role.ADMIN) {
        throw createError('You are not authorized to view applications', 403)
    }

    await expireOverdueOffers()

    return Application.find({ driveId: drive._id })
        .populate({
            path: 'studentId',
            select: 'userId rollNumber branch graduationYear cgpa activeBacklogs skills resumeUrl',
            populate: { path: 'userId', select: 'name email' }
        })
        .sort({ createdAt: -1 })
}

export const updateApplicationStatus = async (
    applicationId,
    userId,
    role,
    { status, interviewDate, meetingLink, notes, offerDeadline } = {}
) => {
    if (![Role.RECRUITER, Role.ADMIN].includes(role))
        throw createError('Only recruiters and admins can update applications', 403)
    if (![ApplicationStatus.SHORTLISTED, ApplicationStatus.SELECTED, ApplicationStatus.REJECTED].includes(status))
        throw createError('Invalid application status')

    await expireOverdueOffers()

    const application = await Application.findById(applicationId)
    if (!application) throw createError('Application not found', 404)

    if (role === Role.RECRUITER) {
        const drive = await JobDrive.findById(application.driveId)
        const ownsDrive = drive && (await Company.exists({ _id: drive.companyId, recruiterId: userId }))

        if (!ownsDrive) throw createError('You are not authorized to update this application', 403)
        if (!canChangeStatus(application.status, status))
            throw createError(`Cannot change status from ${application.status} to ${status}`)
    }

    if (application.offer.status === OfferStatus.ACCEPTED) throw createError('An accepted offer cannot be changed')

    if (status === ApplicationStatus.SHORTLISTED && interviewDate) {
        const scheduledAt = new Date(interviewDate)
        if (isNaN(scheduledAt) || scheduledAt <= new Date())
            throw createError('Interview must be scheduled at a valid future date and time')

        application.interview = { scheduledAt, meetingLink: meetingLink ?? null, notes: notes ?? null }
    }

    if (status === ApplicationStatus.SELECTED) {
        const student = await StudentProfile.findById(application.studentId)
        if (student?.isPlaced) throw createError('Student has already accepted another offer')

        application.offer = {
            status: OfferStatus.PENDING,
            deadline: getOfferDeadline(offerDeadline),
            respondedAt: null
        }
    } else if (application.offer.status === OfferStatus.PENDING) {
        application.offer = { status: null, deadline: null, respondedAt: null }
    }

    application.status = status
    return application.save()
}

export const respondToOffer = async (student, applicationId, decision) => {
    if (!['ACCEPT', 'DECLINE'].includes(decision)) throw createError('decision must be ACCEPT or DECLINE')

    await expireOverdueOffers()

    const application = await Application.findOne({ _id: applicationId, studentId: student._id }).populate({
        path: 'driveId',
        select: 'title packageLpa companyId',
        populate: { path: 'companyId', select: 'name' }
    })
    if (!application) throw createError('Application not found', 404)

    if (application.offer.status === OfferStatus.EXPIRED)
        throw createError('The deadline to respond to this offer has passed')
    if (application.status !== ApplicationStatus.SELECTED || application.offer.status !== OfferStatus.PENDING)
        throw createError('This application has no pending offer')

    const now = new Date()

    if (decision === 'DECLINE') {
        application.status = ApplicationStatus.REJECTED
        application.offer.status = OfferStatus.DECLINED
        application.offer.respondedAt = now
        return application.save()
    }

    const placed = await StudentProfile.findOneAndUpdate(
        { _id: student._id, isPlaced: { $ne: true } },
        {
            $set: {
                isPlaced: true,
                placedCompany: application.driveId?.companyId?.name ?? null,
                packageLpa: application.driveId?.packageLpa ?? null
            }
        }
    )
    if (!placed) throw createError('You have already accepted an offer', 409)

    application.offer.status = OfferStatus.ACCEPTED
    application.offer.respondedAt = now
    await application.save()

    await Application.updateMany(
        {
            studentId: student._id,
            _id: { $ne: application._id },
            status: ApplicationStatus.SELECTED,
            'offer.status': OfferStatus.PENDING
        },
        {
            $set: {
                status: ApplicationStatus.REJECTED,
                'offer.status': OfferStatus.DECLINED,
                'offer.respondedAt': now
            }
        }
    )
    await Application.updateMany(
        { studentId: student._id, status: { $in: [ApplicationStatus.APPLIED, ApplicationStatus.SHORTLISTED] } },
        { $set: { status: ApplicationStatus.REJECTED } }
    )

    return application
}

export const withdrawApplication = async (student, applicationId) => {
    const application = await Application.findOne({ _id: applicationId, studentId: student._id })
    if (!application) throw createError('Application not found', 404)
    if (application.status !== ApplicationStatus.APPLIED)
        throw createError('Only applications with APPLIED status can be withdrawn')

    await application.deleteOne()

    return { message: 'Application withdrawn successfully' }
}
