export function notFound(request, response, next) {
  const error = new Error(`Route not found: ${request.method} ${request.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _request, response, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "An unexpected server error occurred.";

  if (error.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(error.errors).map((item) => item.message).join(" ");
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A post with this slug already exists.";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid post identifier.";
  } else if (error.name === "MulterError") {
    statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = error.code === "LIMIT_FILE_SIZE"
      ? "Image must be 5 MB or smaller."
      : error.message;
  }

  if (statusCode >= 500) console.error(error);
  response.status(statusCode).json({ message });
}
