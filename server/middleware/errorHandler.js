const mongoose = require('mongoose');

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Resource not found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Request body must be valid JSON' });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, detail]) => [field, detail.message])
    );
    return res
      .status(400)
      .json({ success: false, message: Object.values(errors)[0], errors });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ success: false, message: `Invalid value for ${err.path}` });
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  // Never leak stack traces or internal messages to the client.
  return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
}

module.exports = { notFound, errorHandler };
