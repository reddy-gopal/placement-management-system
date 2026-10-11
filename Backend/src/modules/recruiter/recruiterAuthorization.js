import { Role } from '../../enum.js';

/**
 * M1 integration contract:
 * the authentication middleware must assign { id, role } to req.user.
 */
export const requireRecruiterActor = (req, res, next) => {
  if (!req.user?.id || !req.user?.role) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'An authenticated user is required'
      }
    });
  }

  if (req.user.role !== Role.RECRUITER) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'RECRUITER_ACCESS_REQUIRED',
        message: 'Only recruiters can access this resource'
      }
    });
  }

  return next();
};
