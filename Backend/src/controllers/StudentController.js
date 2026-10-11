import * as StudentService from '../services/StudentService.js'

export const getProfile = (req, res) => {
    res.status(200).json(req.student)
}

export const getProfileById = async (req, res) => {
    const student = await StudentService.getStudentProfileById(req.params.studentId, req.user.id, req.user.role)
    res.status(200).json(student)
}

export const getAllProfiles = async (req, res) => {
    const students = await StudentService.getAllStudentProfiles()
    res.status(200).json(students)
}

export const createProfile = async (req, res) => {
    const student = await StudentService.createStudentProfile(req.user.id, req.body)
    res.status(201).json(student)
}

export const updateProfile = async (req, res) => {
    const student = await StudentService.updateStudentProfile(req.student, req.body)
    res.status(200).json(student)
}

export const deleteProfile = async (req, res) => {
    const result = await StudentService.deleteStudentProfile(req.params.studentId)
    res.status(200).json(result)
}
