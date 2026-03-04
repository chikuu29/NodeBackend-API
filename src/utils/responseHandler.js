/**
 * Centralized response handler — ensures consistent JSON shape across all endpoints.
 *
 * Usage:
 *   const { sendSuccess, sendError } = require('../../utils/responseHandler');
 *   sendSuccess(res, { data: users }, 'Users fetched successfully');
 *   sendError(res, 400, 'Validation failed', errors);
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} [payload={}] - Additional data to include in the response
 * @param {string} [message='Success'] - Human-readable success message
 * @param {number} [statusCode=200] - HTTP status code
 */
const sendSuccess = (res, payload = {}, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...payload,
    });
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res - Express response object
 * @param {number} [statusCode=500] - HTTP status code
 * @param {string} [message='Something went wrong'] - Human-readable error message
 * @param {Array|Object|null} [errors=null] - Detailed error info (validation errors, etc.)
 */
const sendError = (res, statusCode = 500, message = 'Something went wrong', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
