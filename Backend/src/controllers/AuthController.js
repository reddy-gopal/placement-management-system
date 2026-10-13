import * as AuthService from '../services/AuthService.js'

export const signup = async (req, res) => {
    const result = await AuthService.register(req.body)
    res.status(201).json({ success: true, ...result })
}

export const login = async (req, res) => {
    const result = await AuthService.login(req.body)
    res.status(200).json({ success: true, ...result })
}

export const verifyEmail = async (req, res) => {
    const result = await AuthService.verifyEmail(req.body)
    res.status(200).json({ success: true, ...result })
}

export const resendCode = async (req, res) => {
    const result = await AuthService.resendVerificationCode(req.body)
    res.status(200).json({ success: true, ...result })
}

export const testEmail = async (req, res) => {
    const result = await AuthService.sendTestEmail(req.body?.to)
    res.status(200).json({ success: true, result })
}

export const me = async (req, res) => {
    const user = await AuthService.getMe(req.user.id)
    res.status(200).json({ success: true, user })
}
