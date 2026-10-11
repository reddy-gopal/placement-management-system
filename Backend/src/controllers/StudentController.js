import * as StudentService from '../services/StudentService.js'

export const getMyProfile = async (req, res) => {
    const profile = await StudentService.getMyProfile(req.user.id)
    res.status(200).json({ success: true, profile })
}

export const saveMyProfile = async (req, res) => {
    const { profile, created } = await StudentService.saveMyProfile(req.user.id, req.body)
    res.status(created ? 201 : 200).json({
        success: true,
        message: created ? 'Profile created successfully' : 'Profile updated successfully',
        profile
    })
}

export const getProfileById = async (req, res) => {
    const profile = await StudentService.getStudentProfileById(req.params.studentId, req.user.id, req.user.role)
    res.status(200).json({ success: true, profile })
}

export const getAllProfiles = async (req, res) => {
    const students = await StudentService.getAllStudentProfiles()
    res.status(200).json({ success: true, students })
}

export const deleteProfile = async (req, res) => {
    const result = await StudentService.deleteStudentProfile(req.params.studentId)
    res.status(200).json({ success: true, ...result })
}
