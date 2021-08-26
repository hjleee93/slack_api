import * as admin from 'firebase-admin';
import { NextFunction, Request, Response } from 'express';
import { verifyJWT } from '../commons/utils';
import { dbs } from '../commons/globals';
import { Transaction } from 'sequelize';
import cfgOption from '../../config/opt';
import { logger } from '../commons/logger';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { responseError } from '../controllers/_convert';


export function throwError(res: Response, e: string, statusCode = 401) {
    res.statusCode = statusCode;
    res.send({
        error: e
    });
}


export const validateUid = async (req: Request, res: Response, next: Function) => {
    const { game_path, publisher_uid } = req.params;
    if ( !game_path ) {
        return throwError(res, 'invalid game_path')
    }
    if ( !publisher_uid ) {
        // return throwError(res, 'invalid publisher_uid')
    }

    next();
};


export const readyToPlay = async (req: Request, res: Response, next: Function) => {
    const { game_path, publisher_uid, user_uid } = req.params;

    if ( !game_path ) {
        return throwError(res, 'invalid game');
    }

    await dbs.Game.getTransaction(async (transaction: Transaction) => {
        const game = await dbs.Game.findOne({ pathname: game_path }, transaction);

        if ( publisher_uid ) {
            let publisherRecord = await dbs.Publisher.findOne({ uid: publisher_uid }, transaction);

            if ( user_uid ) {

            }
        }

        // @ts-ignore
        req.data = {
            game: {
                origin: '',
                url: game.url_game,
                title: game.title,
                frame_type: game.control_type
            },
            server: {
                url: cfgOption.Url.DeployApiV1,
                token: '',
                shared_url: `${cfgOption.Url.Host}/game/${game.pathname}/`,
            },
            publisher: {
                uid: publisher_uid || '',
            },
        };

    });

    next();
};


declare global {
    namespace Express {
        export interface Request {
            user: any
            files: any
        }
    }
}


export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if ( !req.user ) {
        return responseError(res, CreateError(ErrorCodes.UNAUTHORIZED), 401);
    }
    next();
}
export const isDeveloper = (req: Request, res: Response, next: NextFunction) => {
    // if ( !req.user.is_developer ) {
    //     return responseError(res, CreateError(ErrorCodes.IS_NOT_DEVELOPER), 401);
    // }
    next();
}

export const getIdToken = (req: Request) => {
    if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
        !(req.cookies && req.cookies.__session)) {
        logger.debug('No Firebase ID token was passed as a Bearer token in the Authorization header.',
            'Make sure you authorize your request by providing the following HTTP header:',
            'Authorization: Bearer <Firebase ID Token>',
            'or by passing a "__session" cookie.');
        // res.status(403).send('Unauthorized');
        return;
    }

    let idToken;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        // console.log('Found "Authorization" header');
        // Read the ID Token from the Authorization header.
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else if(req.cookies) {
        logger.debug('Found "__session" cookie');
        // Read the ID Token from cookie.
        idToken = req.cookies.__session;
    } else {
        // No cookie
        // res.status(403).send('Unauthorized');
        return;
    }
    return idToken
}

export const validateFirebaseIdToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idToken = getIdToken(req);
        if ( idToken ) {
            req.user = await admin.auth().verifyIdToken(idToken);
        }
        return next();
    } catch (error) {
        return responseError(res, CreateError(ErrorCodes.UNAUTHORIZED), 401);
        // return throwError(res, 'Unauthorized', 403)
    }
};

export const validateAdminIdToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const idToken = getIdToken(req);
        req.user = await verifyJWT(idToken);
        return next();
    }
    catch (error) {
        return responseError(res, CreateError(ErrorCodes.UNAUTHORIZED), 401);
        // return throwError(res, 'Unauthorized', 403)
    }
}


export const checkUserDenied = (name: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const claim = req.user.zempie;
        if ( claim?.deny[name]?.state && claim.deny[name].date >= Date.now() ) {
            return responseError(res, CreateError(ErrorCodes.ACCESS_DENY), 403);
            // return throwError(res, `Access Denied: ${name}`, 403)
        }
        return next();
    }
}


export const adminTracking = async (req: Request, res: Response, next: NextFunction) => {
    dbs.AdminLog.create({
        admin_id: req.user.id,
        path: req.route.path.substring('/api/v1/admin/'.length),
        body: JSON.stringify(req.body)
    })
    return next();
}
