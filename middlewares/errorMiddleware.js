// middlewares/errorMiddleware.js

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    // Detailed error output for debugging
    return res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }

  // Clean, user-friendly message for production
  const errorResponse = {
    success: false,
    message: err.isOperational
      ? err.message
      : 'Something went wrong. Please try again later.',
  };

  res.status(statusCode).json(errorResponse);
};

// Optional utility class for structured errors
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
