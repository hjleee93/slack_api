import { NextFunction, Request, Response } from 'express';


export function throwError(res: Response, e: string, statusCode = 401) {
    res.statusCode = statusCode;
    res.send({
        error: e
    });
}

declare global {
    namespace Express {
        export interface Request {
            user: any
            files: any
        }
    }
}
