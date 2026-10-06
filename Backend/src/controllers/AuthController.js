import AuthService from '../services/AuthService.js'

export const register = async (req,res) => {
    try {
        const user = await AuthService.register(req.body)

        return res.status(201).json({
            success: true,
            message: `User registered successfully`,
            data: user
        })
    }catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req,res) => {
    try {
        const user = await AuthService.login(req.body)

        return res.status(200).json({
            success: true,
            message: `Login successful`,
            data: user
        })
    }catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}

export const me = async (req,res) => {
    return res.json({
        success:true,
        data:req.user
    })   
}