import DriveService from './driveService.js';
import { sendM3Error } from './m3Error.js';

export const createDrive = async (req, res) => {
  try {
    const drive = await DriveService.createDrive(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      data: { drive }
    });
  } catch (error) {
    return sendM3Error(res, error);
  }
};

export const listMyDrives = async (req, res) => {
  try {
    const result = await DriveService.listDrives(req.user.id, req.query);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return sendM3Error(res, error);
  }
};

export const getMyDrive = async (req, res) => {
  try {
    const drive = await DriveService.getDrive(req.user.id, req.params.driveId);
    return res.status(200).json({ success: true, data: { drive } });
  } catch (error) {
    return sendM3Error(res, error);
  }
};

export const updateMyDrive = async (req, res) => {
  try {
    const drive = await DriveService.updateDrive(req.user.id, req.params.driveId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Placement drive updated successfully',
      data: { drive }
    });
  } catch (error) {
    return sendM3Error(res, error);
  }
};

export const updateMyDriveStatus = async (req, res) => {
  try {
    const drive = await DriveService.updateDriveStatus(req.user.id, req.params.driveId, req.body);
    return res.status(200).json({
      success: true,
      message: `Placement drive is now ${drive.status}`,
      data: { drive }
    });
  } catch (error) {
    return sendM3Error(res, error);
  }
};
