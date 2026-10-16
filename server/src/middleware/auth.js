import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { HttpError } from '../utils/errors.js';

export const cookieName = 'autoflow_session';
export function cookieOptions(config) {
  return { httpOnly: true, secure: config.NODE_ENV === 'production', sameSite: 'lax', path: '/api', maxAge: 8 * 60 * 60 * 1000 };
}
export function issueSession(res, user, config) {
  const token = jwt.sign({ workshopId: user.workshop.toString(), version: user.tokenVersion }, config.JWT_SECRET, { subject: user._id.toString(), expiresIn: '8h', issuer: 'autoflow', audience: 'autoflow-web', algorithm: 'HS256' });
  res.cookie(cookieName, token, cookieOptions(config));
}
export function clearSession(res, config) {
  const { maxAge, ...options } = cookieOptions(config);
  res.clearCookie(cookieName, options);
}
export function authenticate(config) {
  return async (req, res, next) => {
    const token = req.cookies[cookieName];
    if (!token) throw new HttpError(401, 'Please sign in to continue.');
    let claims;
    try { claims = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'], issuer: 'autoflow', audience: 'autoflow-web' }); }
    catch { throw new HttpError(401, 'Your session has expired. Please sign in again.'); }
    const user = await User.findOne({ _id: claims.sub, workshop: claims.workshopId, active: true }).select('+tokenVersion');
    if (!user || user.tokenVersion !== claims.version) throw new HttpError(401, 'Your session is no longer valid. Please sign in again.');
    req.user = user;
    req.workshopId = user.workshop;
    next();
  };
}
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new HttpError(403, 'You do not have permission to perform this action.');
    next();
  };
}
