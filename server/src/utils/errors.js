export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message = error.message;
  if (error.code === 11000) { status = 409; message = 'An account with this email already exists in this workshop.'; }
  if (error.name === 'ValidationError' || error.name === 'CastError' || error.name === 'StrictModeError') { status = 400; message = 'Invalid record data.'; }
  if (status >= 500) { console.error('Request failed', { requestId: req.id, name: error.name }); message = 'An unexpected error occurred. Please try again.'; }
  res.status(status).json({ error: { message, requestId: req.id, ...(error.details ? { details: error.details } : {}) } });
}
