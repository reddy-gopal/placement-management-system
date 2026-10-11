const mongoose = require('mongoose');

const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const GRADUATION_YEAR_MIN = 2000;
const GRADUATION_YEAR_MAX = 2100;

function isHttpUrl(value) {
  try {
    const { protocol } = new URL(value);
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required.'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Roll number must be at most 30 characters.'],
      unique: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required.'],
      enum: { values: BRANCHES, message: `Branch must be one of: ${BRANCHES.join(', ')}.` },
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required.'],
      min: [GRADUATION_YEAR_MIN, `Graduation year must be between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}.`],
      max: [GRADUATION_YEAR_MAX, `Graduation year must be between ${GRADUATION_YEAR_MIN} and ${GRADUATION_YEAR_MAX}.`],
      validate: { validator: Number.isInteger, message: 'Graduation year must be a whole number.' },
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required.'],
      min: [0, 'CGPA must be between 0 and 10.'],
      max: [10, 'CGPA must be between 0 and 10.'],
    },
    activeBacklogs: {
      type: Number,
      required: [true, 'Active backlogs is required.'],
      min: [0, 'Active backlogs cannot be negative.'],
      validate: { validator: Number.isInteger, message: 'Active backlogs must be a whole number.' },
    },
    skills: {
      type: [{ type: String, trim: true }],
      default: [],
    },
    resumeUrl: {
      type: String,
      trim: true,
      validate: { validator: isHttpUrl, message: 'Resume URL must be a valid http(s) URL.' },
    },
    // Managed by the hiring pipeline (M5) / admin — never by the student form.
    isPlaced: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: 'student_profiles' }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
module.exports.BRANCHES = BRANCHES;
module.exports.GRADUATION_YEAR_MIN = GRADUATION_YEAR_MIN;
module.exports.GRADUATION_YEAR_MAX = GRADUATION_YEAR_MAX;
module.exports.isHttpUrl = isHttpUrl;
