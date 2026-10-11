import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import JobDrive from '../../src/entity/JobDrive.js';
import { EmploymentType, JobDriveStatus } from '../../src/enum.js';

const validDrive = (overrides = {}) => new JobDrive({
  companyId: new mongoose.Types.ObjectId(),
  title: 'Graduate Software Engineer',
  description: 'Entry-level software engineering position',
  packageLpa: 8.5,
  location: 'Hyderabad',
  employmentType: EmploymentType.FULL_TIME,
  deadline: new Date(Date.now() + 86_400_000),
  eligibility: {
    minCgpa: 7,
    maxBacklogs: 0,
    allowedBranches: ['cse', ' CSE ', 'it']
  },
  ...overrides
});

test('job drive accepts valid data and normalizes allowed branches', async () => {
  const drive = validDrive();
  await drive.validate();

  assert.deepEqual(drive.eligibility.allowedBranches, ['CSE', 'IT']);
  assert.equal(drive.status, JobDriveStatus.DRAFT);
});

test('job drive requires its Company relationship and core job fields', async () => {
  const drive = new JobDrive({});

  await assert.rejects(
    () => drive.validate(),
    (error) => (
      Boolean(error.errors.companyId)
      && Boolean(error.errors.title)
      && Boolean(error.errors.description)
      && Boolean(error.errors.packageLpa)
      && Boolean(error.errors.location)
      && Boolean(error.errors.employmentType)
      && Boolean(error.errors.deadline)
    )
  );
});

test('job drive rejects invalid package, CGPA, backlog, and branch values', async () => {
  const drive = validDrive({
    packageLpa: -1,
    eligibility: {
      minCgpa: 11,
      maxBacklogs: 1.5,
      allowedBranches: []
    }
  });

  await assert.rejects(
    () => drive.validate(),
    (error) => (
      Boolean(error.errors.packageLpa)
      && Boolean(error.errors['eligibility.minCgpa'])
      && Boolean(error.errors['eligibility.maxBacklogs'])
      && Boolean(error.errors['eligibility.allowedBranches'])
    )
  );
});

test('job drive rejects unsupported employment types and statuses', async () => {
  const drive = validDrive({
    employmentType: 'PART_TIME',
    status: 'ARCHIVED'
  });

  await assert.rejects(
    () => drive.validate(),
    (error) => Boolean(error.errors.employmentType) && Boolean(error.errors.status)
  );
});

test('new job drive rejects a deadline in the past', async () => {
  const drive = validDrive({ deadline: new Date(Date.now() - 86_400_000) });

  await assert.rejects(
    () => drive.validate(),
    (error) => Boolean(error.errors.deadline)
  );
});

test('job drive schema defines ownership and catalog indexes', () => {
  const indexes = JobDrive.schema.indexes();
  const ownershipIndex = indexes.find(([fields]) => fields.companyId === 1 && fields.createdAt === -1);
  const catalogIndex = indexes.find(([fields]) => fields.status === 1 && fields.deadline === 1);

  assert.ok(ownershipIndex);
  assert.ok(catalogIndex);
  assert.equal(JobDrive.schema.path('companyId').options.immutable, true);
});

test('job drive JSON output does not expose the mongoose version key', () => {
  const output = validDrive().toJSON();
  assert.equal(output.__v, undefined);
});
