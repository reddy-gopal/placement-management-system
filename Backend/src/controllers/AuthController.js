import * as AuthService from '../services/AuthService.js'

export const signup = async (req, res) => {
    const { user, token } = await AuthService.register(req.body)
    res.status(201).json({ success: true, token, user })
}

export const login = async (req, res) => {
    const { user, token } = await AuthService.login(req.body)
    res.status(200).json({ success: true, token, user })
}

export const me = async (req, res) => {
    const user = await AuthService.getMe(req.user.id)
    res.status(200).json({ success: true, user })
}
