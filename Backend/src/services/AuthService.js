import bcrypt from 'bcryptjs'
import User from '../entity/User.js'
import { Role } from '../enum.js'
import { createError } from '../utils/errors.js'
import { generateToken, userDtoHelper, emailHelper, generateVerificationCode } from '../helper.js'
import { sendVerificationEmail, sendTestEmail as sendTestEmailService } from './EmailService.js'

const CODE_EXPIRY_MINUTES = 15

export const register = async ({ name, email, password, role } = {}) => {
    if (typeof name !== 'string' || !name.trim()) throw createError('Name is required')
    email = emailHelper(email)
    if (typeof password !== 'string' || password.length < 4) throw createError('Password must be at least 4 characters')
    if (role !== undefined && ![Role.STUDENT, Role.RECRUITER].includes(role))
        throw createError('Role must be STUDENT or RECRUITER')

    const existingUser = await User.findOne({ email })
    if (existingUser && existingUser.isVerified) {
        throw createError('User with this email already exists', 409)
    }

    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
    const hashcode = await bcrypt.hash(password, 10)

    let user = existingUser
    if (user) {
        // User already attempted registration previously without verifying
        user.name = name.trim()
        user.password = hashcode
        user.role = role || user.role || Role.STUDENT
        user.verificationCode = verificationCode
        user.verificationCodeExpires = verificationCodeExpires
        await user.save()
    } else {
        user = await User.create({
            name: name.trim(),
            email,
            password: hashcode,
            role: role || Role.STUDENT,
            isVerified: false,
            verificationCode,
            verificationCodeExpires
        })
    }

    // Send verification code email via Resend
    await sendVerificationEmail({
        to: email,
        name: user.name,
        code: verificationCode
    })

    return {
        message: 'Registration successful! A verification code has been sent to your email.',
        email: user.email,
        needsVerification: true
    }
}

export const verifyEmail = async ({ email, code } = {}) => {
    email = emailHelper(email)
    if (!code || typeof code !== 'string' || !code.trim()) {
        throw createError('Verification code is required', 400)
    }

    const cleanCode = code.trim()
    const user = await User.findOne({ email })
    if (!user) throw createError('User not found', 404)

    if (user.isVerified) {
        return {
            message: 'Email is already verified.',
            user: userDtoHelper(user),
            token: generateToken(user)
        }
    }

    if (user.verificationCode !== cleanCode) {
        throw createError('Invalid verification code', 400)
    }

    if (!user.verificationCodeExpires || new Date() > user.verificationCodeExpires) {
        throw createError('Verification code has expired. Please request a new code.', 400)
    }

    user.isVerified = true
    user.verificationCode = null
    user.verificationCodeExpires = null
    await user.save()

    return {
        message: 'Email verified successfully!',
        user: userDtoHelper(user),
        token: generateToken(user)
    }
}

export const resendVerificationCode = async ({ email } = {}) => {
    email = emailHelper(email)
    const user = await User.findOne({ email })
    if (!user) throw createError('User not found', 404)

    if (user.isVerified) {
        throw createError('Email is already verified. Please sign in.', 400)
    }

    const verificationCode = generateVerificationCode()
    const verificationCodeExpires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)

    user.verificationCode = verificationCode
    user.verificationCodeExpires = verificationCodeExpires
    await user.save()

    await sendVerificationEmail({
        to: user.email,
        name: user.name,
        code: verificationCode
    })

    return {
        message: 'A new verification code has been sent to your email.'
    }
}

export const login = async ({ email, password } = {}) => {
    email = emailHelper(email)
    if (typeof password !== 'string' || !password) throw createError('Password is required')

    const user = await User.findOne({ email })
    if (!user) throw createError('Invalid email or password', 401)

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) throw createError('Invalid email or password', 401)

    // Audit check: Non-admin users must verify their email
    if (user.role !== Role.ADMIN && !user.isVerified) {
        // Generate and send a fresh code
        const verificationCode = generateVerificationCode()
        user.verificationCode = verificationCode
        user.verificationCodeExpires = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
        await user.save()

        await sendVerificationEmail({
            to: user.email,
            name: user.name,
            code: verificationCode
        })

        const error = createError(
            'Please verify your email before logging in. A new verification code has been sent to your inbox.',
            403
        )
        error.needsVerification = true
        error.email = user.email
        throw error
    }

    return { user: userDtoHelper(user), token: generateToken(user) }
}

export const getMe = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw createError('User not found', 404)

    return userDtoHelper(user)
}

export const sendTestEmail = async (to) => {
    return await sendTestEmailService(to)
}
