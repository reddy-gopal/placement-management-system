import assert from 'node:assert/strict';
import test from 'node:test';
import CompanyService from '../../src/modules/recruiter/companyService.js';
import DriveService from '../../src/modules/recruiter/driveService.js';
import { upsertMyCompany } from '../../src/modules/recruiter/companyController.js';
import { listMyDrives, updateMyDriveStatus } from '../../src/modules/recruiter/driveController.js';
import recruiterRouter from '../../src/modules/recruiter/routes.js';

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

test('recruiter router exposes the complete M3 endpoint set', () => {
  const routes = recruiterRouter.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      return `${method} ${layer.route.path}`;
    });

  assert.deepEqual(routes, [
    'GET /company',
    'PUT /company',
    'GET /drives',
    'POST /drives',
    'GET /drives/:driveId',
    'PATCH /drives/:driveId',
    'PATCH /drives/:driveId/status'
  ]);
});

test('company controller passes the M1 user id to its service', async (t) => {
  t.mock.method(CompanyService, 'upsertCompany', async (recruiterId, body) => ({
    _id: 'company-1', recruiterId, ...body
  }));
  const res = responseDouble();

  await upsertMyCompany(
    { user: { id: 'recruiter-1' }, body: { name: 'Example Labs' } },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.company.recruiterId, 'recruiter-1');
});

test('drive list controller returns pagination metadata', async (t) => {
  t.mock.method(DriveService, 'listDrives', async () => ({
    drives: [{ _id: 'drive-1', title: 'Engineer' }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 }
  }));
  const res = responseDouble();

  await listMyDrives({ user: { id: 'recruiter-1' }, query: {} }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.drives.length, 1);
  assert.equal(res.body.data.pagination.total, 1);
});

test('drive status controller uses the dedicated status service', async (t) => {
  t.mock.method(DriveService, 'updateDriveStatus', async (_recruiterId, driveId, body) => ({
    _id: driveId,
    status: body.status
  }));
  const res = responseDouble();

  await updateMyDriveStatus({
    user: { id: 'recruiter-1' },
    params: { driveId: 'drive-1' },
    body: { status: 'OPEN' }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.drive.status, 'OPEN');
});
