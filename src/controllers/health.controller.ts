import type { Request, Response } from 'express';

import { sendSuccess } from '../utils/apiResponse';

export const healthController = {
  check: (_req: Request, res: Response) => {
    return sendSuccess(res, 'Service is healthy', {
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  }
};
