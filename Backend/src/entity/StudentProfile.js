const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    rollNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    branch: {
      type: String,
      required: true,
      trim: true
    },

    graduationYear: {
      type: Number,
      required: true
    },

    cgpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    },

    activeBacklogs: {
      type: Number,
      default: 0,
      min: 0
    },

    skills: {
      type: [String],
      default: []
    },

    resumeUrl: {
      type: String,
      default: null
    },

    isPlaced: {
      type: Boolean,
      default: false
    },

    placedCompany: {
      type: String,
      default: null
    },

    packageLpa: {
      type: Number,
      default: null,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);
export default StudentProfile