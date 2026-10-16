import { z } from 'zod';
import { HttpError } from '../utils/errors.js';

const name = z.string().trim().min(2).max(100);
const email = z.email().trim().toLowerCase().max(254);
const phone = z.string().trim().max(30).regex(/^[+\d\s().-]*$/).default('');
const password = z.string().min(12).max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes');
const workshopSlug = z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const loginSchema = z.object({ email, password: z.string().min(1).max(200), workshopSlug }).strict();
export const registerSchema = z.object({ name, email, phone, password, workshopSlug }).strict();
export const employeeSchema = z.object({ name, email, phone, password }).strict();
export const profileSchema = z.object({ name, phone }).strict();
export const passwordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: password }).strict();
export const activeSchema = z.object({ active: z.boolean() }).strict();
export const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).default(''),
  role: z.enum(['admin', 'technician', 'customer']).optional(),
  active: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'name']).default('newest'),
}).strict();

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const error = new HttpError(400, 'Please check the submitted fields.');
      error.details = result.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }));
      return next(error);
    }
    req.validated = result.data;
    next();
  };
}
