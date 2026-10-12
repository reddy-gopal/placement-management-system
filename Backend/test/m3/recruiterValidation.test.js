import assert from 'node:assert/strict';
import test from 'node:test';
import { EmploymentType, JobDriveStatus } from '../../src/enum.js';
import {
  validateCompanyInput,
  validateDriveInput,
  validateDriveListQuery,
  validateDriveStatusInput
} from '../../src/modules/recruiter/recruiterValidation.js';

test('company input is normalized for persistence', () => {
  const company = validateCompanyInput({
    name: '  Example Labs  ',
    website: 'https://example.com',
    contactEmail: 'Hiring@Example.com'
  });

  assert.equal(company.name, 'Example Labs');
  assert.equal(company.contactEmail, 'hiring@example.com');
});

test('company input rejects invalid URLs', () => {
  assert.throws(
    () => validateCompanyInput({ name: 'Example', website: 'not-a-url' }),
    /website must be a valid/
  );
});

test('drive input is normalized and duplicate branches are removed', () => {
  const drive = validateDriveInput({
    title: ' Graduate Engineer ',
    description: 'Entry-level engineering position',
    packageLpa: '8.5',
    location: 'Hyderabad',
    employmentType: EmploymentType.FULL_TIME,
    deadline: new Date(Date.now() + 86_400_000).toISOString(),
    eligibility: {
      minCgpa: '7',
      maxBacklogs: 0,
      allowedBranches: ['cse', 'CSE', 'it']
    }
  });

  assert.equal(drive.title, 'Graduate Engineer');
  assert.equal(drive.packageLpa, 8.5);
  assert.deepEqual(drive.eligibility.allowedBranches, ['CSE', 'IT']);
});

test('drive input rejects deadlines in the past', () => {
  assert.throws(
    () => validateDriveInput({
      title: 'Engineer',
      description: 'Description',
      packageLpa: 5,
      location: 'Remote',
      employmentType: EmploymentType.FULL_TIME,
      deadline: '2020-01-01T00:00:00.000Z',
      eligibility: { minCgpa: 6, maxBacklogs: 0, allowedBranches: ['CSE'] }
    }),
    /deadline must be in the future/
  );
});

test('list query caps the accepted limit', () => {
  assert.throws(() => validateDriveListQuery({ limit: 101 }), /limit must be between/);
  assert.equal(validateDriveListQuery({ limit: '25' }).limit, 25);
  assert.throws(() => validateDriveListQuery({ limit: 2.5 }), /whole number/);
});

test('list query normalizes pagination and search', () => {
  const query = validateDriveListQuery({ page: '3', limit: '10', search: ' Engineer ' });
  assert.equal(query.page, 3);
  assert.equal(query.limit, 10);
  assert.equal(query.search, 'Engineer');
});

test('general drive edits cannot bypass status transition validation', () => {
  assert.throws(
    () => validateDriveInput({ status: JobDriveStatus.CLOSED }, { partial: true }),
    /dedicated status endpoint/
  );
});

test('status input permits only recruiter-controlled states', () => {
  assert.equal(validateDriveStatusInput({ status: JobDriveStatus.OPEN }), JobDriveStatus.OPEN);
  assert.throws(
    () => validateDriveStatusInput({ status: JobDriveStatus.CANCELLED }),
    /status must be one of/
  );
});
