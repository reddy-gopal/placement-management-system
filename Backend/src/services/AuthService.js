import bcrypt from 'bcryptjs'
import User from '../entity/User.js'
import { Role } from '../enum.js'
import { createError } from '../utils/errors.js'
import { generateToken, userDtoHelper, emailHelper } from '../helper.js'

export const register = async ({ name, email, password, role } = {}) => {
    if (typeof name !== 'string' || !name.trim()) throw createError('Name is required')
    email = emailHelper(email)
    if (typeof password !== 'string' || password.length < 4) throw createError('Password must be at least 4 characters')
    if (role !== undefined && ![Role.STUDENT, Role.RECRUITER].includes(role))
        throw createError('Role must be STUDENT or RECRUITER')

    const existUser = await User.exists({ email })
    if (existUser) throw createError('User with this email already exists', 409)

    const hashcode = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashcode, role: role || Role.STUDENT })

    return { user: userDtoHelper(user), token: generateToken(user) }
}

export const login = async ({ email, password } = {}) => {
    email = emailHelper(email)
    if (typeof password !== 'string' || !password) throw createError('Password is required')

    const user = await User.findOne({ email })
    if (!user) throw createError('Invalid email or password', 401)

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) throw createError('Invalid email or password', 401)

    return { user: userDtoHelper(user), token: generateToken(user) }
}

export const getMe = async (userId) => {
    const user = await User.findById(userId)
    if (!user) throw createError('User not found', 404)

    return userDtoHelper(user)
}
