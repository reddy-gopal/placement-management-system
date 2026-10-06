import mongoose from 'mongoose';
import { ApplicationStatus } from '../enum.js';

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
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Application', applicationSchema);