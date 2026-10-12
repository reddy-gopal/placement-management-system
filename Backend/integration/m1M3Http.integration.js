import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import router from '../src/routes/index.js'
import User from '../src/entity/User.js'
import Company from '../src/entity/Company.js'
import JobDrive from '../src/entity/JobDrive.js'

const request = async (baseUrl, path, options = {}) => {
    const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    })
    const body = await response.json()
    return { response, body }
}

test('M1 HTTP authentication protects the complete M3 recruiter API', {
    timeout: 120_000
}, async () => {
    process.env.JWT_SECRET = 'm1-m3-http-integration-secret'
    process.env.JWT_EXPIRES = '1h'

    const mongoServer = await MongoMemoryServer.create({
        binary: { downloadDir: '/private/tmp/nexstep-mongodb-binaries' }
    })
    let server

    try {
        await mongoose.connect(mongoServer.getUri(), { dbName: 'nexstep_m1_m3_http_test' })
        await Promise.all([User.syncIndexes(), Company.syncIndexes(), JobDrive.syncIndexes()])

        const app = express()
        app.use(express.json())
        app.use('/api/v1', router)
        app.use((error, _req, res, _next) => {
            res.status(error.statusCode || error.status || 500).json({
                success: false,
                message: error.message
            })
        })

        server = await new Promise((resolve) => {
            const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
        })
        const { port } = server.address()
        const baseUrl = `http://127.0.0.1:${port}`

        const recruiterSignup = await request(baseUrl, '/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                name: 'HTTP Recruiter',
                email: 'http-recruiter@example.com',
                password: 'secure-password',
                role: 'RECRUITER'
            })
        })
        assert.equal(recruiterSignup.response.status, 201)
        assert.ok(recruiterSignup.body.token)
        assert.equal(recruiterSignup.body.user.password, undefined)

        const recruiterHeaders = {
            Authorization: `Bearer ${recruiterSignup.body.token}`
        }

        const me = await request(baseUrl, '/api/v1/auth/me', { headers: recruiterHeaders })
        assert.equal(me.response.status, 200)
        assert.equal(me.body.user.role, 'RECRUITER')

        const companyResult = await request(baseUrl, '/api/v1/recruiter/company', {
            method: 'PUT',
            headers: recruiterHeaders,
            body: JSON.stringify({
                name: 'HTTP Example Labs',
                website: 'https://example.com',
                contactEmail: 'hiring@example.com'
            })
        })
        assert.equal(companyResult.response.status, 200)

        const driveResult = await request(baseUrl, '/api/v1/recruiter/drives', {
            method: 'POST',
            headers: recruiterHeaders,
            body: JSON.stringify({
                title: 'Graduate Engineer',
                description: 'Entry-level engineering role for campus graduates.',
                packageLpa: 8.5,
                location: 'Hyderabad',
                employmentType: 'FULL_TIME',
                deadline: new Date(Date.now() + 86_400_000).toISOString(),
                eligibility: {
                    minCgpa: 7,
                    maxBacklogs: 0,
                    allowedBranches: ['CSE', 'IT']
                },
                status: 'OPEN'
            })
        })
        assert.equal(driveResult.response.status, 201)

        const drives = await request(baseUrl, '/api/v1/recruiter/drives?page=1&limit=8', {
            headers: recruiterHeaders
        })
        assert.equal(drives.response.status, 200)
        assert.equal(drives.body.data.pagination.total, 1)
        assert.equal(drives.body.data.drives[0].title, 'Graduate Engineer')

        const studentSignup = await request(baseUrl, '/api/v1/auth/signup', {
            method: 'POST',
            body: JSON.stringify({
                name: 'HTTP Student',
                email: 'http-student@example.com',
                password: 'secure-password',
                role: 'STUDENT'
            })
        })
        const forbidden = await request(baseUrl, '/api/v1/recruiter/company', {
            headers: { Authorization: `Bearer ${studentSignup.body.token}` }
        })
        assert.equal(forbidden.response.status, 403)
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve))
        await mongoose.disconnect()
        await mongoServer.stop()
    }
})
