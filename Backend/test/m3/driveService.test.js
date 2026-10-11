import assert from 'node:assert/strict';
import test from 'node:test';
import Company from '../../src/entity/Company.js';
import JobDrive from '../../src/entity/JobDrive.js';
import { EmploymentType, JobDriveStatus } from '../../src/enum.js';
import DriveService from '../../src/modules/recruiter/driveService.js';

const validDriveBody = () => ({
  title: 'Graduate Engineer',
  description: 'Entry-level engineering position',
  packageLpa: 8.5,
  location: 'Hyderabad',
  employmentType: EmploymentType.FULL_TIME,
  deadline: new Date(Date.now() + 86_400_000).toISOString(),
  eligibility: { minCgpa: 7, maxBacklogs: 0, allowedBranches: ['CSE', 'IT'] }
});

test('drive creation derives company ownership from the authenticated recruiter', async (t) => {
  let createdData;
  t.mock.method(Company, 'findOne', () => ({
    select: async () => ({ _id: 'owned-company' })
  }));
  t.mock.method(JobDrive, 'create', async (data) => {
    createdData = data;
    return {
      ...data,
      populate: async () => data
    };
  });

  await DriveService.createDrive('recruiter-1', {
    ...validDriveBody(),
    companyId: 'attacker-controlled-company',
    recruiterId: 'attacker-controlled-user'
  });

  assert.equal(createdData.companyId, 'owned-company');
  assert.equal(createdData.recruiterId, undefined);
});

test('drive updates include company ownership in the database filter', async (t) => {
  let receivedFilter;
  let receivedUpdate;
  t.mock.method(Company, 'findOne', () => ({
    select: async () => ({ _id: 'owned-company' })
  }));
  t.mock.method(JobDrive, 'findOneAndUpdate', (filter, update) => {
    receivedFilter = filter;
    receivedUpdate = update;
    return {
      populate: async () => ({ _id: filter._id, ...update.$set })
    };
  });

  await DriveService.updateDrive('recruiter-1', 'drive-1', {
    title: 'Updated title',
    companyId: 'attacker-controlled-company'
  });

  assert.deepEqual(receivedFilter, { _id: 'drive-1', companyId: 'owned-company' });
  assert.equal(receivedUpdate.$set.title, 'Updated title');
  assert.equal(receivedUpdate.$set.companyId, undefined);
});

test('drive creation requires a company profile', async (t) => {
  t.mock.method(Company, 'findOne', () => ({ select: async () => null }));

  await assert.rejects(
    () => DriveService.createDrive('recruiter-without-company', validDriveBody()),
    (error) => error.code === 'COMPANY_PROFILE_REQUIRED' && error.status === 409
  );
});

test('status update applies an owned DRAFT to OPEN transition', async (t) => {
  const futureDeadline = new Date(Date.now() + 86_400_000);
  let updateFilter;
  t.mock.method(Company, 'findOne', () => ({
    select: async () => ({ _id: 'owned-company' })
  }));
  t.mock.method(JobDrive, 'findOne', async () => ({
    status: JobDriveStatus.DRAFT,
    deadline: futureDeadline
  }));
  t.mock.method(JobDrive, 'findOneAndUpdate', (filter, update) => {
    updateFilter = filter;
    return {
      populate: async () => ({ _id: 'drive-1', status: update.$set.status })
    };
  });

  const drive = await DriveService.updateDriveStatus(
    'recruiter-1',
    'drive-1',
    { status: JobDriveStatus.OPEN }
  );

  assert.equal(drive.status, JobDriveStatus.OPEN);
  assert.deepEqual(updateFilter, {
    _id: 'drive-1',
    companyId: 'owned-company',
    status: JobDriveStatus.DRAFT
  });
});

test('status update rejects opening a drive after its deadline', async (t) => {
  t.mock.method(Company, 'findOne', () => ({
    select: async () => ({ _id: 'owned-company' })
  }));
  t.mock.method(JobDrive, 'findOne', async () => ({
    status: JobDriveStatus.CLOSED,
    deadline: new Date(Date.now() - 86_400_000)
  }));

  await assert.rejects(
    () => DriveService.updateDriveStatus(
      'recruiter-1',
      'drive-1',
      { status: JobDriveStatus.OPEN }
    ),
    (error) => error.code === 'DEADLINE_PASSED' && error.status === 409
  );
});
