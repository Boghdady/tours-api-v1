// This class care about operational errors (errors that i can predict)
class AppError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
		this.isOperational = true;

		// Show us where's the error happen
		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = AppError;
