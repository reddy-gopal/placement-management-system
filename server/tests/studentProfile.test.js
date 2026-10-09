const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_minimum_32_characters';

const createApp = require('../app');
const StudentProfile = require('../models/StudentProfile');

const PROFILE_URL = '/api/v1/student/profile';

let mongo;
let app;

function tokenFor(userId, role = 'STUDENT') {
  return jwt.sign({ id: String(userId), role, email: 'student@example.com' }, process.env.JWT_SECRET);
}

function newUserId() {
  return new mongoose.Types.ObjectId();
}

function validProfile(overrides = {}) {
  return {
    rollNumber: '21CSE101',
    branch: 'CSE',
    graduationYear: 2027,
    cgpa: 8.5,
    activeBacklogs: 0,
    skills: ['Java', 'React', 'MongoDB'],
    resumeUrl: 'https://example.com/resume.pdf',
    ...overrides,
  };
}

function saveProfile(userId, body) {
  return request(app).post(PROFILE_URL).set('Authorization', `Bearer ${tokenFor(userId)}`).send(body);
}

function getProfile(userId) {
  return request(app).get(PROFILE_URL).set('Authorization', `Bearer ${tokenFor(userId)}`);
}

// mongod can be slow to boot on Windows (antivirus scans the binary).
const MONGO_LAUNCH_TIMEOUT_MS = 150000;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: MONGO_LAUNCH_TIMEOUT_MS } });
  await mongoose.connect(mongo.getUri());
  await StudentProfile.syncIndexes();
  app = createApp();
}, MONGO_LAUNCH_TIMEOUT_MS + 30000);

afterEach(async () => {
  await StudentProfile.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('authentication & authorization', () => {
  it('rejects requests without a token (401)', async () => {
    const res = await request(app).get(PROFILE_URL);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects an invalid token (401)', async () => {
    const res = await request(app).get(PROFILE_URL).set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('rejects a token signed with another secret (401)', async () => {
    const forged = jwt.sign({ id: String(newUserId()), role: 'STUDENT' }, 'some-other-secret');
    const res = await request(app).get(PROFILE_URL).set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects non-student roles (403)', async () => {
    const res = await request(app)
      .post(PROFILE_URL)
      .set('Authorization', `Bearer ${tokenFor(newUserId(), 'RECRUITER')}`)
      .send(validProfile());
    expect(res.status).toBe(403);
    expect(await StudentProfile.countDocuments()).toBe(0);
  });

  it('rejects a token whose id is not a valid ObjectId (401)', async () => {
    const res = await request(app).get(PROFILE_URL).set('Authorization', `Bearer ${tokenFor('abc')}`);
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/student/profile', () => {
  it('returns profile: null when the student has no profile yet', async () => {
    const res = await getProfile(newUserId());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, profile: null });
  });

  it('returns the saved profile', async () => {
    const userId = newUserId();
    await saveProfile(userId, validProfile());

    const res = await getProfile(userId);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      userId: String(userId),
      rollNumber: '21CSE101',
      branch: 'CSE',
      graduationYear: 2027,
      cgpa: 8.5,
      activeBacklogs: 0,
      skills: ['Java', 'React', 'MongoDB'],
      resumeUrl: 'https://example.com/resume.pdf',
      isPlaced: false,
    });
    expect(res.body.profile.__v).toBeUndefined();
  });
});

describe('POST /api/v1/student/profile', () => {
  it('creates a profile (201)', async () => {
    const userId = newUserId();
    const res = await saveProfile(userId, validProfile({ cgpa: 8.5, activeBacklogs: 0, branch: 'CSE' }));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Profile created successfully');
    expect(res.body.profile.cgpa).toBe(8.5);
    expect(await StudentProfile.countDocuments({ userId })).toBe(1);
  });

  it('updates the existing profile without creating a duplicate (200)', async () => {
    const userId = newUserId();
    await saveProfile(userId, validProfile({ cgpa: 8.5 }));

    const res = await saveProfile(userId, validProfile({ cgpa: 9.0 }));
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Profile updated successfully');
    expect(res.body.profile.cgpa).toBe(9);
    expect(await StudentProfile.countDocuments({ userId })).toBe(1);
  });

  it('never creates more than one profile per user, even under concurrent requests', async () => {
    const userId = newUserId();
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => saveProfile(userId, validProfile({ cgpa: 7 + i * 0.1 })))
    );

    results.forEach((res) => expect([200, 201, 409]).toContain(res.status));
    expect(await StudentProfile.countDocuments({ userId })).toBe(1);
  });

  it('enforces a unique userId at the database level', async () => {
    const userId = newUserId();
    await StudentProfile.create({ ...validProfile(), userId });
    await expect(
      StudentProfile.create({ ...validProfile({ rollNumber: 'OTHER1' }), userId })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('accepts boundary CGPA values 0 and 10', async () => {
    const userId = newUserId();
    expect((await saveProfile(userId, validProfile({ cgpa: 0 }))).status).toBe(201);
    expect((await saveProfile(userId, validProfile({ cgpa: 10 }))).status).toBe(200);
  });

  it.each([11, 10.1, -1, 'abc'])('rejects CGPA = %p (400)', async (cgpa) => {
    const res = await saveProfile(newUserId(), validProfile({ cgpa }));
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, message: 'CGPA must be between 0 and 10.' });
    expect(res.body.errors.cgpa).toBeDefined();
    expect(await StudentProfile.countDocuments()).toBe(0);
  });

  it.each([-1, -5])('rejects activeBacklogs = %p (400)', async (activeBacklogs) => {
    const res = await saveProfile(newUserId(), validProfile({ activeBacklogs }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Active backlogs cannot be negative.');
  });

  it('rejects fractional backlogs (400)', async () => {
    const res = await saveProfile(newUserId(), validProfile({ activeBacklogs: 1.5 }));
    expect(res.status).toBe(400);
    expect(res.body.errors.activeBacklogs).toMatch(/whole number/);
  });

  it('requires roll number, branch, graduation year, CGPA and backlogs', async () => {
    const res = await saveProfile(newUserId(), {});
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(
      ['activeBacklogs', 'branch', 'cgpa', 'graduationYear', 'rollNumber'].sort()
    );
  });

  it('rejects an unknown branch (400)', async () => {
    const res = await saveProfile(newUserId(), validProfile({ branch: 'ARTS' }));
    expect(res.status).toBe(400);
    expect(res.body.errors.branch).toBeDefined();
  });

  it.each(['not-a-url', 'javascript:alert(1)', 'ftp://example.com/r.pdf', 'data:application/pdf;base64,AAAA'])(
    'rejects malformed / unsafe resume URL %p (400)',
    async (resumeUrl) => {
      const res = await saveProfile(newUserId(), validProfile({ resumeUrl }));
      expect(res.status).toBe(400);
      expect(res.body.errors.resumeUrl).toBeDefined();
    }
  );

  it('allows skills and resume URL to be empty', async () => {
    const res = await saveProfile(newUserId(), validProfile({ skills: [], resumeUrl: '' }));
    expect(res.status).toBe(201);
    expect(res.body.profile.skills).toEqual([]);
    expect(res.body.profile.resumeUrl).toBeUndefined();
  });

  it('removes a previously saved resume URL when cleared', async () => {
    const userId = newUserId();
    await saveProfile(userId, validProfile());
    const res = await saveProfile(userId, validProfile({ resumeUrl: '' }));
    expect(res.status).toBe(200);
    expect(res.body.profile.resumeUrl).toBeUndefined();
  });

  it('trims, de-duplicates (case-insensitive) and drops empty skills', async () => {
    const res = await saveProfile(
      newUserId(),
      validProfile({ skills: [' Java ', 'java', '', '  ', 'React', 'REACT', 'Node.js'] })
    );
    expect(res.status).toBe(201);
    expect(res.body.profile.skills).toEqual(['Java', 'React', 'Node.js']);
  });

  it('rejects skills that are not a list of strings (400)', async () => {
    const res = await saveProfile(newUserId(), validProfile({ skills: 'Java, React' }));
    expect(res.status).toBe(400);
    expect(res.body.errors.skills).toBeDefined();
  });

  it('ignores client-supplied userId and isPlaced', async () => {
    const userId = newUserId();
    const otherUserId = newUserId();
    const res = await saveProfile(userId, validProfile({ userId: String(otherUserId), isPlaced: true }));

    expect(res.status).toBe(201);
    expect(res.body.profile.userId).toBe(String(userId));
    expect(res.body.profile.isPlaced).toBe(false);
    expect(await StudentProfile.countDocuments({ userId: otherUserId })).toBe(0);
  });

  it('does not let a student reset isPlaced once set by the pipeline', async () => {
    const userId = newUserId();
    await saveProfile(userId, validProfile());
    await StudentProfile.updateOne({ userId }, { isPlaced: true });

    const res = await saveProfile(userId, validProfile({ isPlaced: false }));
    expect(res.body.profile.isPlaced).toBe(true);
  });

  it('returns 409 when the roll number belongs to another student', async () => {
    await saveProfile(newUserId(), validProfile({ rollNumber: '21CSE101' }));
    const res = await saveProfile(newUserId(), validProfile({ rollNumber: '21cse101' }));
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for malformed JSON without leaking internals', async () => {
    const res = await request(app)
      .post(PROFILE_URL)
      .set('Authorization', `Bearer ${tokenFor(newUserId())}`)
      .set('Content-Type', 'application/json')
      .send('{"cgpa": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Request body must be valid JSON' });
  });
});

describe('AUTH_DISABLED dev mode', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    delete process.env.AUTH_DISABLED;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('lets requests through without a token as the fixed dev student', async () => {
    process.env.AUTH_DISABLED = 'true';
    const res = await request(app).post(PROFILE_URL).send(validProfile());
    expect(res.status).toBe(201);
    expect(res.body.profile.userId).toBe('000000000000000000000001');
    expect((await request(app).get(PROFILE_URL)).body.profile.rollNumber).toBe('21CSE101');
  });

  it('is ignored in production', async () => {
    process.env.AUTH_DISABLED = 'true';
    process.env.NODE_ENV = 'production';
    expect((await request(app).get(PROFILE_URL)).status).toBe(401);
  });
});

describe('profile isolation', () => {
  it('each student only sees and edits their own profile', async () => {
    const alice = newUserId();
    const bob = newUserId();

    await saveProfile(alice, validProfile({ rollNumber: 'ALICE01', cgpa: 9.1 }));
    await saveProfile(bob, validProfile({ rollNumber: 'BOB01', cgpa: 7.2 }));

    // Bob updates "his" profile — Alice's must be untouched.
    await saveProfile(bob, validProfile({ rollNumber: 'BOB01', cgpa: 7.9 }));

    const aliceRes = await getProfile(alice);
    const bobRes = await getProfile(bob);
    expect(aliceRes.body.profile).toMatchObject({ rollNumber: 'ALICE01', cgpa: 9.1, userId: String(alice) });
    expect(bobRes.body.profile).toMatchObject({ rollNumber: 'BOB01', cgpa: 7.9, userId: String(bob) });
    expect(await StudentProfile.countDocuments()).toBe(2);
  });
});
