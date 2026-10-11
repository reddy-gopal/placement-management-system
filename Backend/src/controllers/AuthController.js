import * as AuthService from '../services/AuthService.js'

export const register = async (req, res) => {
    const data = await AuthService.register(req.body)
    res.status(201).json({ success: true, message: 'User registered successfully', data })
}

export const login = async (req, res) => {
    const data = await AuthService.login(req.body)
    res.status(200).json({ success: true, message: 'Login successful', data })
}

export const me = async (req, res) => {
    const data = await AuthService.getMe(req.user.id)
    res.status(200).json({ success: true, data })
}
