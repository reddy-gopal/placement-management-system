import mongoose from 'mongoose'
import { ApplicationStatus, OfferStatus } from '../enum.js'

const applicationSchema = new mongoose.Schema(
    {
        driveId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobDrive',
            required: true
        },

        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudentProfile',
            required: true
        },

        resumeUrl: {
            type: String,
            trim: true,
            default: null
        },

        status: {
            type: String,
            enum: Object.values(ApplicationStatus),
            default: ApplicationStatus.APPLIED
        },

        interview: {
            scheduledAt: {
                type: Date,
                default: null
            },

            meetingLink: {
                type: String,
                trim: true,
                default: null
            },

            notes: {
                type: String,
                trim: true,
                default: null
            }
        },

        offer: {
            status: {
                type: String,
                enum: Object.values(OfferStatus),
                default: null
            },

            deadline: {
                type: Date,
                default: null
            },

            respondedAt: {
                type: Date,
                default: null
            }
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model('Application', applicationSchema)
