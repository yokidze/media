import { badRequest } from '../common/errors.js';
export const validate = (schema) => (req, _res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params
    });
    if (!result.success) {
        const flattened = result.error.flatten();
        const firstFieldError = Object.values(flattened.fieldErrors)
            .flat()
            .find((message) => typeof message === 'string' && message.length > 0);
        const firstFormError = flattened.formErrors.find((message) => typeof message === 'string' && message.length > 0);
        next(badRequest(firstFieldError ?? firstFormError ?? 'Validation failed', flattened));
        return;
    }
    req.body = result.data.body;
    req.query = result.data.query;
    req.params = result.data.params;
    next();
};
