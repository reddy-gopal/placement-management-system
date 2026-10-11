import User from '../entity/User.js'
import StudentProfile from '../entity/StudentProfile.js'
import Company from '../entity/Company.js'
import JobDrive from '../entity/JobDrive.js'
import Application from '../entity/Application.js'
import { Role, JobDriveStatus, ApplicationStatus } from '../enum.js'
import { expireOverdueOffers } from '../helper.js'

export const getDashboardStats = async () => {
    await expireOverdueOffers()

    const [
        totalStudents,
        totalRecruiters,
        totalCompanies,
        totalDrives,
        openDrives,
        totalApplications,
        selectedApplications,
        placementStats
    ] = await Promise.all([
        StudentProfile.countDocuments(),
        User.countDocuments({ role: Role.RECRUITER }),
        Company.countDocuments(),
        JobDrive.countDocuments(),
        JobDrive.countDocuments({ status: JobDriveStatus.OPEN }),
        Application.countDocuments(),
        Application.countDocuments({ status: ApplicationStatus.SELECTED }),
        StudentProfile.aggregate([
            { $match: { isPlaced: true } },
            {
                $group: {
                    _id: null,
                    totalPlaced: { $sum: 1 },
                    avgPackage: { $avg: '$packageLpa' },
                    highestPackage: { $max: '$packageLpa' }
                }
            }
        ])
    ])

    const { totalPlaced = 0, avgPackage, highestPackage } = placementStats[0] || {}
    const placementPercentage = totalStudents ? (totalPlaced / totalStudents) * 100 : 0

    return {
        totalPlaced,
        placementPercentage: Number(placementPercentage.toFixed(2)),
        avgPackage: Number((avgPackage ?? 0).toFixed(2)),
        highestPackage: highestPackage ?? 0,
        totalStudents,
        totalRecruiters,
        totalCompanies,
        totalDrives,
        openDrives,
        totalApplications,
        selectedApplications
    }
}

export const getAllStudents = () => StudentProfile.find().populate('userId', 'name email role').sort({ createdAt: -1 })

export const getAllRecruiters = () => User.find({ role: Role.RECRUITER }).select('-password').sort({ createdAt: -1 })

export const getAllCompanies = () => Company.find().populate('recruiterId', 'name email').sort({ createdAt: -1 })

export const getAllDrives = () => JobDrive.find().populate('companyId').sort({ createdAt: -1 })

export const getAllApplications = async () => {
    await expireOverdueOffers()

    return Application.find()
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
        .populate({ path: 'driveId', populate: { path: 'companyId', select: 'name' } })
        .sort({ createdAt: -1 })
}
