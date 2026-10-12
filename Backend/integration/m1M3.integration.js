import assert from 'node:assert/strict'
import test from 'node:test'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import * as AuthService from '../src/services/AuthService.js'
import User from '../src/entity/User.js'
import Company from '../src/entity/Company.js'
import JobDrive from '../src/entity/JobDrive.js'
import CompanyService from '../src/modules/recruiter/companyService.js'
import DriveService from '../src/modules/recruiter/driveService.js'
import { EmploymentType, JobDriveStatus, Role } from '../src/enum.js'

test('M1 recruiter identity owns M3 company and drive records end to end', {
    timeout: 120_000
}, async () => {
    process.env.JWT_SECRET = 'm1-m3-integration-test-secret'
    process.env.JWT_EXPIRES = '1h'

    const mongoServer = await MongoMemoryServer.create({
        binary: { downloadDir: '/private/tmp/nexstep-mongodb-binaries' }
    })

    try {
        await mongoose.connect(mongoServer.getUri(), { dbName: 'nexstep_m1_m3_test' })
        await Promise.all([User.syncIndexes(), Company.syncIndexes(), JobDrive.syncIndexes()])

        const registration = await AuthService.register({
            name: 'Campus Recruiter',
            email: ' Recruiter@Example.com ',
            password: 'secure-password',
            role: Role.RECRUITER
        })

        assert.equal(registration.user.email, 'recruiter@example.com')
        assert.equal(registration.user.role, Role.RECRUITER)
        assert.equal(registration.user.password, undefined)

        const tokenActor = jwt.verify(registration.token, process.env.JWT_SECRET)
        assert.equal(tokenActor.id, registration.user.id.toString())
        assert.equal(tokenActor.role, Role.RECRUITER)

        const storedWithoutPassword = await User.findById(registration.user.id)
        assert.equal(storedWithoutPassword.password, undefined)

        const storedWithPassword = await User.findById(registration.user.id).select('+password')
        assert.equal(await bcrypt.compare('secure-password', storedWithPassword.password), true)

        const login = await AuthService.login({
            email: 'RECRUITER@EXAMPLE.COM',
            password: 'secure-password'
        })
        assert.ok(login.token)

        const company = await CompanyService.upsertCompany(registration.user.id, {
            name: 'Example Labs',
            website: 'https://example.com',
            contactEmail: 'hiring@example.com'
        })
        assert.equal(company.recruiterId.toString(), registration.user.id.toString())

        const drive = await DriveService.createDrive(registration.user.id, {
            title: 'Graduate Software Engineer',
            description: 'Build reliable products with the campus engineering team.',
            packageLpa: 9.5,
            location: 'Hyderabad / Hybrid',
            employmentType: EmploymentType.FULL_TIME,
            deadline: new Date(Date.now() + 86_400_000).toISOString(),
            eligibility: {
                minCgpa: 7,
                maxBacklogs: 0,
                allowedBranches: ['CSE', 'IT']
            },
            status: JobDriveStatus.OPEN
        })

        assert.equal(drive.companyId._id.toString(), company._id.toString())

        const owned = await DriveService.listDrives(registration.user.id, {})
        assert.equal(owned.pagination.total, 1)
        assert.equal(owned.drives[0].title, 'Graduate Software Engineer')

        await assert.rejects(
            () => AuthService.register({
                name: 'Duplicate Recruiter',
                email: 'recruiter@example.com',
                password: 'secure-password',
                role: Role.RECRUITER
            }),
            (error) => error.statusCode === 409
        )
    } finally {
        await mongoose.disconnect()
        await mongoServer.stop()
    }
})
