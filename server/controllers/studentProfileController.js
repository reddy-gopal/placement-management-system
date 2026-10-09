const mongoose = require('mongoose');
const StudentProfile = require('../models/StudentProfile');
const { validateStudentProfileInput } = require('../validators/studentProfileValidator');

const PUBLIC_FIELDS = '-__v';

function getAuthenticatedUserId(req) {
  const userId = req.user && req.user.id;
  return mongoose.isValidObjectId(userId) ? userId : null;
}

function sendInvalidSession(res) {
  return res.status(401).json({ success: false, message: 'Invalid session. Please log in again.' });
}

// GET /api/v1/student/profile
async function getMyProfile(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return sendInvalidSession(res);

    const profile = await StudentProfile.findOne({ userId }).select(PUBLIC_FIELDS).lean();
    // A missing profile is a normal state for new students, not an error.
    return res.status(200).json({ success: true, profile: profile || null });
  } catch (err) {
    return next(err);
  }
}

// POST /api/v1/student/profile — create or update (upsert) the caller's profile
async function upsertMyProfile(req, res, next) {
  try {
    const userId = getAuthenticatedUserId(req);
    if (!userId) return sendInvalidSession(res);

    const { errors, value } = validateStudentProfileInput(req.body);
    if (errors) {
      return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
    }

    const { resumeUrl, ...fields } = value;
    const update = { $set: fields };
    if (resumeUrl) update.$set.resumeUrl = resumeUrl;
    else update.$unset = { resumeUrl: 1 };

    // userId always comes from the verified token; isPlaced is never writable here.
    const result = await StudentProfile.findOneAndUpdate({ userId }, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      includeResultMetadata: true,
      projection: PUBLIC_FIELDS,
    });

    const created = !result.lastErrorObject?.updatedExisting;
    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? 'Profile created successfully' : 'Profile updated successfully',
      profile: result.value,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const message =
        field === 'rollNumber'
          ? 'This roll number is already registered to another student.'
          : 'A profile already exists for this account. Please retry.';
      return res.status(409).json({ success: false, message });
    }
    return next(err);
  }
}

module.exports = { getMyProfile, upsertMyProfile };
