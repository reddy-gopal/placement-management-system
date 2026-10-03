# NexStep — Simplified Data Model (Mongoose Schemas)

## 1. Overview & Entity Relationship

The database requires just **5 clean collections** in MongoDB:

```
[ User ] ──────────1:1──────────► [ StudentProfile ] (if role == 'STUDENT')
    │
    └──────────────1:1──────────► [ Company ]        (if role == 'RECRUITER')
                                      │
                                     1:N
                                      ▼
                                [ JobDrive ]
                                      │
                                     1:N
                                      ▼
                               [ Application ] ◄──N:1── [ StudentProfile ]
```

---

## 2. Mongoose Schemas

### 2.1 User (`users`)
```javascript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // bcrypt hashed
  role: { type: String, enum: ['STUDENT', 'RECRUITER', 'ADMIN'], default: 'STUDENT' },
  createdAt: { type: Date, default: Date.now },
});
```

### 2.2 StudentProfile (`student_profiles`)
```javascript
const StudentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  rollNumber: { type: String, required: true },
  branch: { type: String, required: true }, // e.g. "CSE", "IT", "ECE", "MECH"
  graduationYear: { type: Number, required: true }, // e.g. 2026
  cgpa: { type: Number, required: true, min: 0, max: 10 },
  activeBacklogs: { type: Number, default: 0 },
  skills: [{ type: String }], // e.g. ["React", "Node.js", "Python"]
  resumeUrl: { type: String }, // Direct PDF link or Cloudinary URL
  isPlaced: { type: Boolean, default: false },
  placedCompany: { type: String },
  packageLpa: { type: Number },
});
```

### 2.3 Company (`companies`)
```javascript
const CompanySchema = new mongoose.Schema({
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  website: { type: String },
  industry: { type: String }, // e.g. "IT Services", "Fintech", "Automobile"
  logoUrl: { type: String },
  contactPhone: { type: String },
});
```

### 2.4 JobDrive (`drives`)
```javascript
const JobDriveSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  companyName: { type: String, required: true },
  title: { type: String, required: true }, // e.g. "Graduate Software Engineer"
  description: { type: String, required: true },
  packageLpa: { type: Number, required: true }, // CTC in Lakhs Per Annum (e.g. 8.5)
  location: { type: String, default: 'Bangalore / Remote' },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  // Eligibility Rules
  eligibility: {
    minCgpa: { type: Number, default: 6.0 },
    maxBacklogs: { type: Number, default: 0 },
    allowedBranches: [{ type: String }], // e.g. ["CSE", "IT", "ECE"]
  },
  createdAt: { type: Date, default: Date.now },
});
```

### 2.5 Application (`applications`)
```javascript
const ApplicationSchema = new mongoose.Schema({
  driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDrive', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  resumeUrl: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['APPLIED', 'SHORTLISTED', 'SELECTED', 'REJECTED'], 
    default: 'APPLIED' 
  },
  // Online Interview Details (populated when recruiter shortlists candidate)
  interview: {
    scheduledAt: { type: Date },
    meetingLink: { type: String }, // Auto-generated Jitsi room URL or custom Google Meet
    notes: { type: String },       // e.g. "Round 1: Technical & DSA discussion"
  },
  appliedAt: { type: Date, default: Date.now },
});

// Prevent duplicate application from same student for same drive
ApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });
```
