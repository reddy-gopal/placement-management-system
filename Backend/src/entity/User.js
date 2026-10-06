
import mongoose from "mongoose";
import { Role } from "../enum.js";
const userSchema = new mongoose.Schema(
    {
        name : {
            type: String,
            required : true,
            trim : true
        },

        email : {
            type: String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true
        },
        
        password : {
            type: String,
            required : true,
            minlength : 4
        },

        role : {
            type: String,
            enum : Object.values(Role),
            default : Role.STUDENT,
            required : true
        }
    },
    {
        timestamps: true
    }
)


const User = mongoose.model('User',userSchema)
export default User 