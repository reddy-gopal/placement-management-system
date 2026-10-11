import StudentProfile from '../entity/StudentProfile.js'
import Company from '../entity/Company.js'
import JobDrive from '../entity/JobDrive.js'
import Application from '../entity/Application.js'
import { Role } from '../enum.js'
import { createError } from '../utils/errors.js'
import { applyUpdates, studentEditableFields } from '../helper.js'

export const getStudentProfileById = async (studentId, userId, role) => {
    const student = await StudentProfile.findById(studentId)
    if (!student) throw createError('Student profile not found', 404)

    if (role === Role.ADMIN) return student

    if (role === Role.STUDENT) {
        if (!student.userId.equals(userId)) throw createError('You can only view your own profile', 403)
        return student
    }

    if (role === Role.RECRUITER) {
        const company = await Company.findOne({ recruiterId: userId })
        const driveIds = company ? await JobDrive.find({ companyId: company._id }).distinct('_id') : []
        const applied = await Application.exists({ studentId: student._id, driveId: { $in: driveIds } })

        if (!applied) throw createError('You can only view students who applied to your drives', 403)
        return student
    }

    throw createError('Access denied', 403)
}

export const getAllStudentProfiles = () => StudentProfile.find()

export const createStudentProfile = async (userId, data = {}) => {
    const { rollNumber, branch, graduationYear, cgpa, activeBacklogs, skills, resumeUrl } = data

    if (!rollNumber || !branch || graduationYear === undefined || cgpa === undefined)
        throw createError('rollNumber, branch, graduationYear and cgpa are required')

    const profileExists = await StudentProfile.exists({ userId })
    if (profileExists) throw createError('Student profile already exists', 409)

    const rollNumberTaken = await StudentProfile.exists({ rollNumber })
    if (rollNumberTaken) throw createError('Roll number already exists', 409)

    return StudentProfile.create({
        userId,
        rollNumber,
        branch,
        graduationYear,
        cgpa,
        activeBacklogs: activeBacklogs ?? 0,
        skills: skills ?? [],
        resumeUrl: resumeUrl ?? null
    })
}

export const updateStudentProfile = async (student, data = {}) => {
    if (data.rollNumber !== undefined && data.rollNumber !== student.rollNumber) {
        const rollNumberTaken = await StudentProfile.exists({ rollNumber: data.rollNumber })
        if (rollNumberTaken) throw createError('Roll number already exists', 409)
    }

    applyUpdates(student, data, studentEditableFields)
    return student.save()
}

export const deleteStudentProfile = async (studentId) => {
    const student = await StudentProfile.findById(studentId)
    if (!student) throw createError('Student profile not found', 404)

    await Application.deleteMany({ studentId: student._id })
    await student.deleteOne()

    return { message: 'Student profile deleted successfully' }
}
