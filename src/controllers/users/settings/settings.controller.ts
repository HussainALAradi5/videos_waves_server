import type { Request, Response } from 'express'
import type { UpdateSettingsDto } from '../../../dtos/users/settings/update-settings.dto'
import * as settingsService from '../../../services/users/settings/settings.service'
import { sendSuccess } from '../../../utilities/responses/response.utility'
import { getBody, requireUser } from '../../../utilities/requests/request.utility'

export const getMySettings = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await settingsService.getSettings(requireUser(req)))
}

export const updateMySettings = async (req: Request, res: Response): Promise<void> => {
  sendSuccess(res, await settingsService.updateSettings(getBody<UpdateSettingsDto>(req), requireUser(req)))
}
