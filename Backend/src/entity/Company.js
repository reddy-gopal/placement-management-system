import mongoose from 'mongoose'

const isHttpUrl = (value) => {
  if (value === null || value === undefined) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const isEmail = (value) => (
  value === null
  || value === undefined
  || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
);

const companySchema = new mongoose.Schema(
  {
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },

    website: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
      validate: {
        validator: isHttpUrl,
        message: 'website must be a valid http or https URL'
      }
    },

    industry: {
      type: String,
      trim: true,
      default: null,
      maxlength: 120
    },

    description: {
      type: String,
      trim: true,
      default: null,
      maxlength: 2000
    },

    logoUrl: {
      type: String,
      trim: true,
      default: null,
      maxlength: 500,
      validate: {
        validator: isHttpUrl,
        message: 'logoUrl must be a valid http or https URL'
      }
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
      maxlength: 254,
      validate: {
        validator: isEmail,
        message: 'contactEmail must be a valid email address'
      }
    },

    contactPhone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30
    }
  },
  {
    timestamps: true,
    collection: 'companies',
    toJSON: {
      transform: (_document, returnedObject) => {
        delete returnedObject.__v;
        return returnedObject;
      }
    }
  }
)

const Company = mongoose.model('Company', companySchema)
export default Company
