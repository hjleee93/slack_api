import { NextFunction, Response, Request } from 'express';
import * as _ from 'lodash';



export const responseError = (res: Response, error: Error, statusCode: number = 400) => {
    try {
        res.status(statusCode).send({
            error: JSON.parse(error.message),
        })
    }
    catch (e) {
        res.status(statusCode).send({
            error: error.message,
        })
    }
};

export default function convert(func: Function, middleware: boolean = false) {
    console.log(func)

    function response(res: Response, result: any) {
        res.header('Last-Modified', (new Date()).toUTCString());
        if( result instanceof Error ) {
            return responseError(res, result);
        }

        return res.status(200).send({
            result: result || {}
        });
    }

    return async (req: Request, res: Response, next: NextFunction) => {
        console.log(req, res)

        try {
            const params = _.assignIn({}, req.body, req.query, req.params);

            // const user = req.user? _.assignIn({}, req.user) : null
            console.log(func)
            const result = await func(params, undefined, { req, res });

            if ( middleware ) {
                return next();
            }
            response(res, result);
        }
        catch(e) {
            response(res, e);
        }
    }
}