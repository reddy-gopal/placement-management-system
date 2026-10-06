import User from '../entity/User.js'
import bcrypt from 'bcryptjs'
import { Role } from '../enum.js'
import jwt from 'jsonwebtoken'

const generateToken = (user) =>{
    return jwt.sign({
        id: user._id,
        email: user.email,
        role:user.role
        },
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES || '7d'}
    )
}

const userDtoHelper = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
}

const register = async ({ name,email,password,role }) => {

    const existUser = await User.findOne({email})

    if (existUser){
        throw new Error(`User with this email already exist`);
    }

    const hashcode = await bcrypt.hash(password,10);
    const user = await User.create({
        name,
        email,
        password:hashcode,
        role: role || Role.STUDENT
    })

    const token = generateToken(user);

    return {
        user: userDtoHelper(user),
        token
    }

}

const login = async ({ email,password }) => {
    const user =await User.findOne({email});

    if (!user){
        throw new Error(`Invalid email or password`);
    }
    
    const passwordMatch =await bcrypt.compare(password,user.password);
    if (!passwordMatch){
        throw new Error(`Invalid email or password`);
    }
    const token = generateToken(user)
    return {
        user: userDtoHelper(user),
        token
    }
}
const AuthService = {login,register}
export default AuthService