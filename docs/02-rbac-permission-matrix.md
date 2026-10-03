# NexStep — Simplified RBAC Permission Matrix

## 1. Access Control Matrix

The mini-project uses simple Express middleware `auth(roles)` to enforce permissions based on the user's JWT role claim.

| Resource | Action | Student | Recruiter | Admin (TPO) | Notes / Scope |
|---|---|:---:|:---:|:---:|---|
| **Auth** | Sign Up / Log In | ✅ | ✅ | ✅ | Public endpoints |
| **Profile** | View / Edit Own Profile | ✅ | ✅ | ✅ | Scoped to `req.user.id` |
| **Profile** | View Any Student Profile | ❌ | ✅ | ✅ | Recruiter sees only applicants to their drives; Admin sees all |
| **Drives** | View Active Drives List | ✅ | ✅ | ✅ | All authenticated users can browse published drives |
| **Drives** | Create / Edit Drive | ❌ | ✅ | ✅ | Recruiters manage own drives; Admin manages any drive |
| **Drives** | Delete / Cancel Drive | ❌ | ❌ | ✅ | Admin only |
| **Eligibility** | Check Eligibility for Drive | ✅ | ❌ | ✅ | Calculated dynamically based on student CGPA & backlogs |
| **Applications**| Submit Application | ✅ | ❌ | ❌ | Student must meet drive eligibility rules |
| **Applications**| View Own Applications | ✅ | ❌ | ❌ | Scoped to `studentId == req.user.id` |
| **Applications**| View Drive Applicants | ❌ | ✅ | ✅ | Recruiter sees only applicants for their own posted drives |
| **Applications**| Update Status (Shortlist/Select)| ❌ | ✅ | ✅ | Recruiter or Admin marks `SHORTLISTED`, `SELECTED`, `REJECTED` |
| **Dashboard** | Placement Statistics | ❌ | ❌ | ✅ | Overall institutional KPIs |

---

## 2. Express Middleware Implementation

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // { id, role, email }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}
```
