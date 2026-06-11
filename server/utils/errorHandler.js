/**
 * Production-grade error handler and logger for backend API routes.
 */
function handleControllerError(req, res, err, actionName) {
  console.error(`================================================`);
  console.error(`❌ ERROR in Route: ${req.method} ${req.originalUrl || req.url}`);
  console.error(`📝 Action: ${actionName}`);
  console.error(`💬 Error Message: ${err.message}`);
  
  if (err.code) {
    console.error(`🔢 DB Error Code: ${err.code}`);
  }
  
  if (err.stack) {
    console.error(`📚 Stack Trace:\n${err.stack}`);
  }
  console.error(`================================================`);

  // Do not send response if headers have already been sent by the route
  if (res.headersSent) return;

  res.status(500).json({
    error: `Internal Server Error: ${actionName}`,
    message: err.message,
    code: err.code || null
  });
}

module.exports = { handleControllerError };
