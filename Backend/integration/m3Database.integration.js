import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Company from '../src/entity/Company.js';
import JobDrive from '../src/entity/JobDrive.js';
import { EmploymentType, JobDriveStatus } from '../src/enum.js';

const futureDeadline = () => new Date(Date.now() + 86_400_000);

test('M3 collections enforce indexes, relationships, and immutable ownership', {
  timeout: 120_000
}, async () => {
  const mongoServer = await MongoMemoryServer.create({
    binary: { downloadDir: '/private/tmp/nexstep-mongodb-binaries' }
  });

  try {
    await mongoose.connect(mongoServer.getUri(), { dbName: 'nexstep_m3_test' });
    await Promise.all([Company.syncIndexes(), JobDrive.syncIndexes()]);

    const recruiterId = new mongoose.Types.ObjectId();
    const company = await Company.create({
      recruiterId,
      name: 'Example Labs',
      website: 'https://example.com',
      contactEmail: 'hiring@example.com'
    });

    await assert.rejects(
      () => Company.create({ recruiterId, name: 'Duplicate Company' }),
      (error) => error.code === 11000
    );

    const secondCompany = await Company.create({
      recruiterId: new mongoose.Types.ObjectId(),
      name: 'Second Company'
    });

    const drive = await JobDrive.create({
      companyId: company._id,
      title: 'Graduate Software Engineer',
      description: 'Entry-level software engineering position',
      packageLpa: 8.5,
      location: 'Hyderabad',
      employmentType: EmploymentType.FULL_TIME,
      deadline: futureDeadline(),
      eligibility: {
        minCgpa: 7,
        maxBacklogs: 0,
        allowedBranches: ['CSE', 'IT']
      },
      status: JobDriveStatus.DRAFT
    });

    const ownedDrives = await JobDrive.find({ companyId: company._id });
    const otherCompanyDrives = await JobDrive.find({ companyId: secondCompany._id });
    assert.equal(ownedDrives.length, 1);
    assert.equal(otherCompanyDrives.length, 0);

    const originalCompanyId = drive.companyId.toString();
    drive.companyId = secondCompany._id;
    await drive.save();
    assert.equal(drive.companyId.toString(), originalCompanyId);

    const companyIndexes = await Company.collection.indexes();
    const driveIndexes = await JobDrive.collection.indexes();
    assert.ok(companyIndexes.some((index) => index.unique && index.key.recruiterId === 1));
    assert.ok(driveIndexes.some((index) => index.key.companyId === 1 && index.key.createdAt === -1));
    assert.ok(driveIndexes.some((index) => index.key.status === 1 && index.key.deadline === 1));

    const populatedDrive = await JobDrive.findById(drive._id).populate('companyId', 'name website');
    assert.equal(populatedDrive.companyId.name, 'Example Labs');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
});
