import express from 'express'
import * as AuthController from '../controllers/AuthController.js'
import * as StudentController from '../controllers/StudentController.js'
import * as CompanyController from '../controllers/CompanyController.js'
import * as JobDriveController from '../controllers/JobDriveController.js'
import * as ApplicationController from '../controllers/ApplicationController.js'
import * as AdminController from '../controllers/AdminController.js'
import {
    authenticate,
    studentOnly,
    studentProfileExists,
    recruiterOnly,
    companyProfileExists,
    adminOnly
} from '../middlewares/index.js'

const router = express.Router()

// Auth routes
router.post('/auth/register', AuthController.register)
router.post('/auth/login', AuthController.login)
router.get('/auth/me', authenticate, AuthController.me)

// Student routes
router.get('/students/me', authenticate, studentOnly, studentProfileExists, StudentController.getProfile)
router.post('/students/me', authenticate, studentOnly, StudentController.createProfile)
router.put('/students/me', authenticate, studentOnly, studentProfileExists, StudentController.updateProfile)
router.get('/students', authenticate, adminOnly, StudentController.getAllProfiles)
router.get('/students/:studentId', authenticate, StudentController.getProfileById)
router.delete('/students/:studentId', authenticate, adminOnly, StudentController.deleteProfile)

// Company routes
router.get('/companies/me', authenticate, recruiterOnly, companyProfileExists, CompanyController.getCompany)
router.post('/companies/me', authenticate, recruiterOnly, CompanyController.createCompany)
router.put('/companies/me', authenticate, recruiterOnly, companyProfileExists, CompanyController.updateCompany)
router.delete('/companies/me', authenticate, recruiterOnly, companyProfileExists, CompanyController.deleteCompany)
router.get('/companies', authenticate, CompanyController.getAllCompanies)
router.get('/companies/recruiter/:recruiterId', authenticate, CompanyController.getCompanyByRecruiter)
router.get('/companies/:companyId', authenticate, CompanyController.getCompanyById)

// Job drive routes
router.post('/drives', authenticate, JobDriveController.createDrive)
router.get('/drives', authenticate, JobDriveController.getAllDrives)
router.get('/drives/:driveId', authenticate, JobDriveController.getDriveById)
router.put('/drives/:driveId', authenticate, JobDriveController.updateDrive)
router.patch('/drives/:driveId/status', authenticate, JobDriveController.updateDriveStatus)
router.delete('/drives/:driveId', authenticate, JobDriveController.deleteDrive)

// Application routes
router.post(
    '/drives/:driveId/apply',
    authenticate,
    studentOnly,
    studentProfileExists,
    ApplicationController.applyForDrive
)
router.get('/drives/:driveId/applications', authenticate, ApplicationController.getDriveApplications)
router.get('/applications/me', authenticate, studentOnly, studentProfileExists, ApplicationController.getMyApplications)
router.patch('/applications/:applicationId/status', authenticate, ApplicationController.updateApplicationStatus)
router.patch(
    '/applications/:applicationId/offer',
    authenticate,
    studentOnly,
    studentProfileExists,
    ApplicationController.respondToOffer
)
router.delete(
    '/applications/:applicationId',
    authenticate,
    studentOnly,
    studentProfileExists,
    ApplicationController.withdrawApplication
)

// Admin routes
router.get('/admin/stats', authenticate, adminOnly, AdminController.getDashboardStats)
router.get('/admin/students', authenticate, adminOnly, AdminController.getAllStudents)
router.get('/admin/recruiters', authenticate, adminOnly, AdminController.getAllRecruiters)
router.get('/admin/companies', authenticate, adminOnly, AdminController.getAllCompanies)
router.get('/admin/drives', authenticate, adminOnly, AdminController.getAllDrives)
router.get('/admin/applications', authenticate, adminOnly, AdminController.getAllApplications)

export default router
