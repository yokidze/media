import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';
import { badRequest } from '../common/errors.js';

export const validate = (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction): void => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (!result.success) {
    const flattened = result.error.flatten();
    const firstFieldError = Object.values(flattened.fieldErrors)
      .flat()
      .find((message): message is string => typeof message === 'string' && message.length > 0);
    const firstFormError = flattened.formErrors.find((message): message is string => typeof message === 'string' && message.length > 0);

    next(badRequest(firstFieldError ?? firstFormError ?? 'Validation failed', flattened));
    return;
  }

  req.body = result.data.body;
  req.query = result.data.query as Request['query'];
  req.params = result.data.params;
  next();
};
