import Company from '../../entity/Company.js';
import JobDrive from '../../entity/JobDrive.js';
import { JobDriveStatus } from '../../enum.js';
import { M3Error } from './m3Error.js';
import {
  validateDriveInput,
  validateDriveListQuery,
  validateDriveStatusInput
} from './recruiterValidation.js';

const companySummaryFields = 'name website industry logoUrl';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getRecruiterCompany = async (recruiterId) => {
  const company = await Company.findOne({ recruiterId }).select('_id');
  if (!company) {
    throw new M3Error(409, 'COMPANY_PROFILE_REQUIRED', 'Create a company profile before managing drives');
  }
  return company;
};

const createDrive = async (recruiterId, body) => {
  const company = await getRecruiterCompany(recruiterId);
  const driveData = validateDriveInput(body);
  const drive = await JobDrive.create({ ...driveData, companyId: company._id });
  return drive.populate('companyId', companySummaryFields);
};

const listDrives = async (recruiterId, query) => {
  const company = await getRecruiterCompany(recruiterId);
  const { filter, search, page, limit } = validateDriveListQuery(query);
  const databaseFilter = {
    companyId: company._id,
    ...filter,
    ...(search ? { title: { $regex: escapeRegex(search), $options: 'i' } } : {})
  };

  const drivesQuery = JobDrive.find(databaseFilter)
    .populate('companyId', companySummaryFields)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const [drives, total] = await Promise.all([
    drivesQuery,
    JobDrive.countDocuments(databaseFilter)
  ]);

  return {
    drives,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getDrive = async (recruiterId, driveId) => {
  const company = await getRecruiterCompany(recruiterId);
  const drive = await JobDrive.findOne({ _id: driveId, companyId: company._id })
    .populate('companyId', companySummaryFields);

  if (!drive) {
    throw new M3Error(404, 'DRIVE_NOT_FOUND', 'The drive does not exist or is not owned by this recruiter');
  }
  return drive;
};

const updateDrive = async (recruiterId, driveId, body) => {
  const company = await getRecruiterCompany(recruiterId);
  const driveData = validateDriveInput(body, { partial: true });
  const drive = await JobDrive.findOneAndUpdate(
    { _id: driveId, companyId: company._id },
    { $set: driveData },
    { returnDocument: 'after', runValidators: true }
  ).populate('companyId', companySummaryFields);

  if (!drive) {
    throw new M3Error(404, 'DRIVE_NOT_FOUND', 'The drive does not exist or is not owned by this recruiter');
  }
  return drive;
};

const statusTransitions = {
  [JobDriveStatus.DRAFT]: [JobDriveStatus.OPEN],
  [JobDriveStatus.OPEN]: [JobDriveStatus.CLOSED],
  [JobDriveStatus.CLOSED]: [JobDriveStatus.OPEN]
};

const updateDriveStatus = async (recruiterId, driveId, body) => {
  const company = await getRecruiterCompany(recruiterId);
  const requestedStatus = validateDriveStatusInput(body);
  const existingDrive = await JobDrive.findOne({ _id: driveId, companyId: company._id });

  if (!existingDrive) {
    throw new M3Error(404, 'DRIVE_NOT_FOUND', 'The drive does not exist or is not owned by this recruiter');
  }

  if (existingDrive.status === requestedStatus) {
    return existingDrive.populate('companyId', companySummaryFields);
  }

  if (!statusTransitions[existingDrive.status]?.includes(requestedStatus)) {
    throw new M3Error(
      409,
      'INVALID_STATUS_TRANSITION',
      `A drive cannot move from ${existingDrive.status} to ${requestedStatus}`
    );
  }

  if (requestedStatus === JobDriveStatus.OPEN && existingDrive.deadline <= new Date()) {
    throw new M3Error(409, 'DEADLINE_PASSED', 'A drive with a past deadline cannot be opened');
  }

  const drive = await JobDrive.findOneAndUpdate(
    { _id: driveId, companyId: company._id, status: existingDrive.status },
    { $set: { status: requestedStatus } },
    { returnDocument: 'after', runValidators: true }
  ).populate('companyId', companySummaryFields);

  if (!drive) {
    throw new M3Error(409, 'CONCURRENT_UPDATE', 'The drive was changed by another request; reload and try again');
  }
  return drive;
};

const DriveService = { createDrive, listDrives, getDrive, updateDrive, updateDriveStatus };
export default DriveService;
