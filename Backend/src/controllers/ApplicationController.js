import * as ApplicationService from '../services/ApplicationService.js'

export const applyForDrive = async (req, res) => {
    const application = await ApplicationService.applyForDrive(req.student, req.params.driveId)
    res.status(201).json({ message: 'Application submitted successfully', application })
}

export const getMyApplications = async (req, res) => {
    const applications = await ApplicationService.getMyApplications(req.student)
    res.status(200).json({ applications })
}

export const getDriveApplications = async (req, res) => {
    const applications = await ApplicationService.getDriveApplications(req.params.driveId, req.user.id, req.user.role)
    res.status(200).json({ applications })
}

export const updateApplicationStatus = async (req, res) => {
    const application = await ApplicationService.updateApplicationStatus(
        req.params.applicationId,
        req.user.id,
        req.user.role,
        req.body
    )
    res.status(200).json({ message: 'Application updated successfully', application })
}

export const respondToOffer = async (req, res) => {
    const application = await ApplicationService.respondToOffer(
        req.student,
        req.params.applicationId,
        req.body?.decision
    )
    res.status(200).json({ message: `Offer ${application.offer.status.toLowerCase()} successfully`, application })
}

export const withdrawApplication = async (req, res) => {
    const result = await ApplicationService.withdrawApplication(req.student, req.params.applicationId)
    res.status(200).json(result)
}
