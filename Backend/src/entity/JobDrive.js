import mongoose from 'mongoose';
import { EmploymentType , JobDriveStatus } from '../enum.js';
const jobDriveSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    packageLpa: {
      type: Number,
      required: true,
      min: 0
    },

    location: {
      type: String,
      required: true,
      trim: true
    },

    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true
    },

    deadline: {
      type: Date,
      required: true
    },

    eligibility: {
      minCgpa: {
        type: Number,
        required: true,
        min: 0,
        max: 10
      },

      maxBacklogs: {
        type: Number,
        default: 0,
        min: 0
      },

      allowedBranches: {
        type: [String],
        default: []
      }
    },

    status: {
      type: String,
      enum: Object.values(JobDriveStatus),
      default: JobDriveStatus.DRAFT
    }
  },
  {
    timestamps: true
  }
);
const JobDrive = mongoose.model('JobDrive', jobDriveSchema);
export default JobDrive