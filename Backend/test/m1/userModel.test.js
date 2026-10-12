import assert from 'node:assert/strict'
import test from 'node:test'
import User from '../../src/entity/User.js'
import { Role } from '../../src/enum.js'

const validUser = () => ({
    name: 'Recruiter Account',
    email: 'recruiter@example.com',
    password: 'hashed-password-value',
    role: Role.RECRUITER
})

test('user model validates and normalizes M1 account data', async () => {
    const user = new User({ ...validUser(), email: ' Recruiter@Example.com ' })
    await user.validate()

    assert.equal(user.email, 'recruiter@example.com')
    assert.equal(user.role, Role.RECRUITER)
})

test('user model rejects invalid email, short password, and unsupported role', async () => {
    const user = new User({
        name: 'A',
        email: 'not-an-email',
        password: 'short',
        role: 'SUPER_ADMIN'
    })
    const error = await user.validate().then(() => null, (validationError) => validationError)

    assert.ok(error.errors.name)
    assert.ok(error.errors.email)
    assert.ok(error.errors.password)
    assert.ok(error.errors.role)
})

test('user password is private by default and removed from JSON', () => {
    assert.equal(User.schema.path('password').options.select, false)

    const serialized = new User(validUser()).toJSON()
    assert.equal(serialized.password, undefined)
    assert.equal(serialized.__v, undefined)
})

test('user schema declares a unique email index', () => {
    const indexes = User.schema.indexes()
    assert.ok(indexes.some(([fields, options]) => fields.email === 1 && options.unique))
})
