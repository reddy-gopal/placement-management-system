import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../entity/User.js'
import { Role } from '../enum.js'

const createAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexstep'
        console.log(`Connecting to MongoDB...`)
        await mongoose.connect(mongoUri)

        // Parse command line arguments or environment variables
        const args = process.argv.slice(2)
        const emailArg = args[0] || process.env.ADMIN_EMAIL || 'admin@nexstep.com'
        const passwordArg = args[1] || process.env.ADMIN_PASSWORD || 'Admin@12345'
        const nameArg = args[2] || process.env.ADMIN_NAME || 'System Administrator'

        const email = emailArg.trim().toLowerCase()
        const password = passwordArg.trim()
        const name = nameArg.trim()

        const hashedPassword = await bcrypt.hash(password, 10)

        let user = await User.findOne({ email })

        if (user) {
            console.log(`User found with email ${email}. Updating to ADMIN...`)
            user.name = name
            user.password = hashedPassword
            user.role = Role.ADMIN
            user.isVerified = true
            user.verificationCode = null
            user.verificationCodeExpires = null
            await user.save()
            console.log(`Admin user updated successfully!`)
        } else {
            console.log(`Creating new admin user with email ${email}...`)
            user = await User.create({
                name,
                email,
                password: hashedPassword,
                role: Role.ADMIN,
                isVerified: true,
                verificationCode: null,
                verificationCodeExpires: null
            })
            console.log(`Admin user created successfully!`)
        }

        console.log('\n========================================')
        console.log('       ADMIN CREDENTIALS                ')
        console.log('========================================')
        console.log(`Role:     ${user.role}`)
        console.log(`Name:     ${user.name}`)
        console.log(`Email:    ${user.email}`)
        console.log(`Verified: ${user.isVerified}`)
        console.log('========================================\n')

        await mongoose.disconnect()
        process.exit(0)
    } catch (error) {
        console.error('Failed to create admin user:', error)
        process.exit(1)
    }
}

createAdmin()
