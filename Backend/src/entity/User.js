import mongoose from 'mongoose'
import { Role } from '../enum.js'
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 120
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },

        password: {
            type: String,
            required: true,
            minlength: 8,
            select: false
        },

        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.STUDENT,
            required: true
        }
    },
    {
        timestamps: true,
        collection: 'users',
        toJSON: {
            transform: (_document, returnedObject) => {
                delete returnedObject.password
                delete returnedObject.__v
                return returnedObject
            }
        }
    }
)

const User = mongoose.model('User', userSchema)
export default User
