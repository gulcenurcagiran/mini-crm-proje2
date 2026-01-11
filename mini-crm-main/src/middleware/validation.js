/**
 * Validation middleware factory
 * Creates Express middleware that validates request body against a Zod schema
 */
function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated/sanitized data
      next();
    } catch (error) {
      // Zod validation error
      if (error.errors && Array.isArray(error.errors)) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      
      // Other errors
      return res.status(400).json({
        message: 'Validation error',
        error: error.message
      });
    }
  };
}

module.exports = {
  validateRequest
};
