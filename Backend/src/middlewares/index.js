import jwt from 'jsonwebtoken'
import User from '../entity/User.js'
import StudentProfile from '../entity/StudentProfile.js'
import Company from '../entity/Company.js'
import { Role } from '../enum.js'

// Auth middleware
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Authentication token required' })

    try {
        req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET)
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }

    next()
}

// Student middleware
export const studentOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id)

    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (user.role !== Role.STUDENT)
        return res.status(403).json({ success: false, message: 'Access denied. Student access required.' })
    if (!user.isVerified)
        return res.status(403).json({ success: false, message: 'Please verify your email address to continue.', needsVerification: true, email: user.email })

    next()
}

export const studentProfileExists = async (req, res, next) => {
    const student = await StudentProfile.findOne({ userId: req.user.id })

    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' })

    req.student = student
    next()
}

// Recruiter middleware
export const recruiterOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id)

    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (user.role !== Role.RECRUITER)
        return res.status(403).json({ success: false, message: 'Access denied. Recruiter access required.' })
    if (!user.isVerified)
        return res.status(403).json({ success: false, message: 'Please verify your email address to continue.', needsVerification: true, email: user.email })

    next()
}

export const companyProfileExists = async (req, res, next) => {
    const company = await Company.findOne({ recruiterId: req.user.id })

    if (!company) return res.status(404).json({ success: false, message: 'Company profile not found' })

    req.company = company
    next()
}

// Admin middleware
export const adminOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id)

    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (user.role !== Role.ADMIN)
        return res.status(403).json({ success: false, message: 'Access denied. Admin access required.' })

    next()
}
