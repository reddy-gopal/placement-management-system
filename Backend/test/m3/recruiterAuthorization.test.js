import assert from 'node:assert/strict';
import test from 'node:test';
import { Role } from '../../src/enum.js';
import { requireRecruiterActor } from '../../src/modules/recruiter/recruiterAuthorization.js';

const responseDouble = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('recruiter actor is allowed', () => {
  const res = responseDouble();
  let called = false;
  requireRecruiterActor(
    { user: { id: 'user-1', role: Role.RECRUITER } },
    res,
    () => { called = true; }
  );
  assert.equal(called, true);
  assert.equal(res.statusCode, null);
});

test('student actor is forbidden', () => {
  const res = responseDouble();
  requireRecruiterActor({ user: { id: 'user-1', role: Role.STUDENT } }, res, () => {});
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error.code, 'RECRUITER_ACCESS_REQUIRED');
});

test('missing M1 actor contract is unauthorized', () => {
  const res = responseDouble();
  requireRecruiterActor({}, res, () => {});
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'AUTHENTICATION_REQUIRED');
});
