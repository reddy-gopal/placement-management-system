import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { authenticate, requireAuth } from '../../src/middlewares/index.js'
import { Role } from '../../src/enum.js'

process.env.JWT_SECRET = 'm1-middleware-test-secret'

const responseDouble = () => ({
    statusCode: null,
    body: null,
    status(code) {
        this.statusCode = code
        return this
    },
    json(body) {
        this.body = body
        return this
    }
})

const tokenFor = (role) => jwt.sign({ id: 'user-1', email: 'user@example.com', role }, process.env.JWT_SECRET)

test('authenticate attaches the verified M1 actor contract', () => {
    const req = { headers: { authorization: `Bearer ${tokenFor(Role.RECRUITER)}` } }
    const res = responseDouble()
    let nextCalled = false

    authenticate(req, res, () => { nextCalled = true })

    assert.equal(nextCalled, true)
    assert.equal(req.user.id, 'user-1')
    assert.equal(req.user.role, Role.RECRUITER)
})

test('authenticate rejects missing and invalid tokens', () => {
    const missingResponse = responseDouble()
    authenticate({ headers: {} }, missingResponse, () => assert.fail('next must not be called'))
    assert.equal(missingResponse.statusCode, 401)

    const invalidResponse = responseDouble()
    authenticate(
        { headers: { authorization: 'Bearer invalid-token' } },
        invalidResponse,
        () => assert.fail('next must not be called')
    )
    assert.equal(invalidResponse.statusCode, 401)
})

test('requireAuth enforces allowed JWT roles', () => {
    const recruiterOnly = requireAuth([Role.RECRUITER])
    const response = responseDouble()

    recruiterOnly(
        { headers: { authorization: `Bearer ${tokenFor(Role.STUDENT)}` } },
        response,
        () => assert.fail('student must not pass recruiter authorization')
    )

    assert.equal(response.statusCode, 403)
})
