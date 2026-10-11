import * as JobDriveService from '../services/JobDriveService.js'

export const createDrive = async (req, res) => {
    const drive = await JobDriveService.createDrive(req.user.id, req.user.role, req.body)
    res.status(201).json({ message: 'Job drive created successfully', drive })
}

export const getAllDrives = async (req, res) => {
    const result = await JobDriveService.getAllDrives(req.user.id, req.user.role, req.query)
    res.status(200).json(result)
}

export const getDriveById = async (req, res) => {
    const drive = await JobDriveService.getDriveById(req.params.driveId, req.user.id, req.user.role)
    res.status(200).json({ drive })
}

export const updateDrive = async (req, res) => {
    const drive = await JobDriveService.updateDrive(req.params.driveId, req.user.id, req.user.role, req.body)
    res.status(200).json({ message: 'Job drive updated successfully', drive })
}

export const updateDriveStatus = async (req, res) => {
    const drive = await JobDriveService.updateDriveStatus(
        req.params.driveId,
        req.user.id,
        req.user.role,
        req.body?.status
    )
    res.status(200).json({ message: 'Job drive status updated successfully', drive })
}

export const deleteDrive = async (req, res) => {
    const result = await JobDriveService.deleteDrive(req.params.driveId, req.user.role)
    res.status(200).json(result)
}
