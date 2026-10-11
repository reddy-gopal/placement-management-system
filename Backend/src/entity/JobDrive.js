import mongoose from 'mongoose';
import { EmploymentType , JobDriveStatus } from '../enum.js';

const normalizeBranches = (branches) => {
  if (!Array.isArray(branches)) return branches;

  return [...new Set(
    branches
      .filter((branch) => typeof branch === 'string')
      .map((branch) => branch.trim().toUpperCase())
      .filter(Boolean)
  )];
};

const jobDriveSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      immutable: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 5000
    },

    packageLpa: {
      type: Number,
      required: true,
      min: 0,
      max: 1000
    },

    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 160
    },

    employmentType: {
      type: String,
      enum: Object.values(EmploymentType),
      required: true
    },

    deadline: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          if (!this.isNew && typeof this.isModified === 'function' && !this.isModified('deadline')) {
            return true;
          }
          return value instanceof Date && value.getTime() > Date.now();
        },
        message: 'deadline must be in the future'
      }
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
        min: 0,
        max: 100,
        validate: {
          validator: Number.isInteger,
          message: 'eligibility.maxBacklogs must be a whole number'
        }
      },

      allowedBranches: {
        type: [{
          type: String,
          trim: true,
          uppercase: true,
          maxlength: 30
        }],
        required: true,
        set: normalizeBranches,
        validate: {
          validator: (branches) => Array.isArray(branches) && branches.length > 0,
          message: 'eligibility.allowedBranches must contain at least one branch'
        }
      }
    },

    status: {
      type: String,
      enum: Object.values(JobDriveStatus),
      default: JobDriveStatus.DRAFT
    }
  },
  {
    timestamps: true,
    collection: 'job_drives',
    toJSON: {
      transform: (_document, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      }
    }
  }
);
jobDriveSchema.index({ companyId: 1, createdAt: -1 });
jobDriveSchema.index({ status: 1, deadline: 1 });

const JobDrive = mongoose.model('JobDrive', jobDriveSchema);
export default JobDrive
