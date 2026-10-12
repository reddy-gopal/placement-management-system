import jwt from 'jsonwebtoken'
import User from '../entity/User.js'
import StudentProfile from '../entity/StudentProfile.js'
import Company from '../entity/Company.js'
import { Role } from '../enum.js'

// M1 authentication contract. Every authenticated feature receives
// req.user = { id, email, role } from the signed JWT.
export const requireAuth = (allowedRoles = []) => (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(401).json({ success: false, message: 'Authentication token required' })

    try {
        const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET)
        if (!decoded?.id || !decoded?.role)
            return res.status(401).json({ success: false, message: 'Invalid authentication token' })

        if (allowedRoles.length && !allowedRoles.includes(decoded.role))
            return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' })

        req.user = decoded
        return next()
    } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' })
    }
}

export const authenticate = requireAuth()

// Student middleware
export const studentOnly = async (req, res, next) => {
    const user = await User.findById(req.user.id)

    if (!user) return res.status(401).json({ success: false, message: 'User not found' })
    if (user.role !== Role.STUDENT)
        return res.status(403).json({ success: false, message: 'Access denied. Student access required.' })

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
