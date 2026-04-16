function successResponse(code, message, data) {
  return {
    success: true,
    code,
    message,
    data
  };
}

function errorResponse(code, message, errors) {
  const payload = {
    success: false,
    code,
    message
  };

  if (Array.isArray(errors) && errors.length) {
    payload.errors = errors;
  }

  return payload;
}

module.exports = {
  errorResponse,
  successResponse
};
