import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    website: {
      type: String,
      trim: true,
      default: null
    },

    industry: {
      type: String,
      trim: true,
      default: null
    },

    description: {
      type: String,
      trim: true,
      default: null
    },

    logoUrl: {
      type: String,
      trim: true,
      default: null
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },

    contactPhone: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Company = mongoose.model('Company', companySchema);
export default Company