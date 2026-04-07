import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
    code?: string;
}

export function errorHandler(err: AppError, _req: Request, res: Response, _next: NextFunction): void {
    console.error('Error:', err.message);

    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    // MySQL duplicate entry
    if (err.code === 'ER_DUP_ENTRY') {
        res.status(409).json({ error: 'Resource already exists.' });
        return;
    }

    // MySQL foreign key constraint
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        res.status(400).json({ error: 'Referenced resource does not exist.' });
        return;
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

export function createError(message: string, statusCode: number): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    return error;
}
