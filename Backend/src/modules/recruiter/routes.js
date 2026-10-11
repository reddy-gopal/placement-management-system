import express from 'express';
import { getMyCompany, upsertMyCompany } from './companyController.js';
import {
  createDrive,
  getMyDrive,
  listMyDrives,
  updateMyDrive,
  updateMyDriveStatus
} from './driveController.js';
import { requireRecruiterActor } from './recruiterAuthorization.js';

const recruiterRouter = express.Router();

recruiterRouter.use(requireRecruiterActor);

recruiterRouter.get('/company', getMyCompany);
recruiterRouter.put('/company', upsertMyCompany);

recruiterRouter.get('/drives', listMyDrives);
recruiterRouter.post('/drives', createDrive);
recruiterRouter.get('/drives/:driveId', getMyDrive);
recruiterRouter.patch('/drives/:driveId', updateMyDrive);
recruiterRouter.patch('/drives/:driveId/status', updateMyDriveStatus);

export default recruiterRouter;
