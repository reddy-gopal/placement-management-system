import * as AdminService from '../services/AdminService.js'

export const getDashboardStats = async (req, res) => {
    const stats = await AdminService.getDashboardStats()
    res.status(200).json({ success: true, ...stats })
}

export const getAllStudents = async (req, res) => {
    const students = await AdminService.getAllStudents()
    res.status(200).json({ success: true, students })
}

export const getAllRecruiters = async (req, res) => {
    const recruiters = await AdminService.getAllRecruiters()
    res.status(200).json({ success: true, recruiters })
}

export const getAllCompanies = async (req, res) => {
    const companies = await AdminService.getAllCompanies()
    res.status(200).json({ success: true, companies })
}

export const getAllDrives = async (req, res) => {
    const drives = await AdminService.getAllDrives()
    res.status(200).json({ success: true, drives })
}

export const getAllApplications = async (req, res) => {
    const applications = await AdminService.getAllApplications()
    res.status(200).json({ success: true, applications })
}
