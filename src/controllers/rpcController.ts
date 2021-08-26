import { Request, Response } from "express";
import { IRpcMethod, IRpcBody, IRpcError } from "./_interfaces";
import { CreateError, ErrorCodes } from "../commons/errorCodes";
import * as admin from "firebase-admin";
import { verifyJWT, verifyPassword } from '../commons/utils';
import { dbs } from '../commons/globals';


class RpcController {
    private methods: {[key: string]: IRpcMethod} = {};

    generator = (name: string, method: Function, auth: boolean = false, is_admin: boolean = false) => {
        this.methods[name] = { auth, method, is_admin };
    }

    routeRpc = async (req: Request, res: Response) => {
        const data: IRpcBody = req.body;
        let error: IRpcError;

        if( data.jsonrpc !== '2.0' ) {
            return onError({
                code: -32600,
                message: 'Bad Request. JSON RPC version is invalid or missing',
                data: null
            }, 400);
        }

        res.header({
            'Content-Type': 'application/json',
            'Last-Modified': (new Date()).toUTCString()
        });

        try {
            const rpcMethod = this.methods[data.method];
            if ( !rpcMethod ) {
                return onError({
                    code: -32601,
                    message: 'Method not found: ' + data.method,
                    data: null
                }, 404);
            }

            // if ok
            let user;
            if ( rpcMethod.auth ) {
                user = rpcMethod.is_admin? await this.validateAdminToken(req) : await this.validateFirebaseIdToken(req);
                if ( !user ) {
                    const e: any = CreateError(ErrorCodes.UNAUTHORIZED);
                    return onFailure({
                        code: -32603,
                        message: e.message,
                        data: e
                    });
                }
            }

            const result = await rpcMethod.method(data.params, user);
            if ( rpcMethod.is_admin ) {
                dbs.AdminLog.create({
                    admin_uid: user.uid,
                    task: rpcMethod.method.toString(),
                    value: data.params,
                })
            }

            return onSuccess(result);
        }
        catch( e ) {
            return onError({
                code: -32601,
                message: e.message,
                data: null
            }, 404);
        }


        function onSuccess(result: any) {
            res.status(200).send({
                jsonrpc: '2.0',
                result,
                error,
                id: data.id,
            })
        }

        function onFailure(error: IRpcError) {
            onError(error, 500);
        }

        function onError(error: IRpcError, statusCode: number) {
            res.status(statusCode).send({
                jsonrpc: '2.0',
                error,
                id: data.id,
            });
        }
    }

    private getIdToken = (req: Request) => {
        let authorization;
        if( typeof req.body.params === "object" ) {
            authorization = req.body.params.authorization;
        }
        else {
            authorization = JSON.parse(req.body.params).authorization;
        }

        if ((!authorization || !authorization.startsWith('Bearer ')) && !(req.cookies && req.cookies.__session)) {
            console.error('No Firebase ID token was passed as a Bearer token in the Authorization header.',
                'Make sure you authorize your request by providing the following HTTP header:',
                'Authorization: Bearer <Firebase ID Token>',
                'or by passing a "__session" cookie.');
            // throw CreateError(ErrorCodes.UNAUTHORIZED);
            return null
        }

        let idToken;
        if (authorization && authorization.startsWith('Bearer ')) {
            // console.log('Found "Authorization" header');
            // Read the ID Token from the Authorization header.
            idToken = authorization.split('Bearer ')[1];
        } else if(req.cookies) {
            console.log('Found "__session" cookie');
            // Read the ID Token from cookie.
            idToken = req.cookies.__session;
        } else {
            // No cookie
            // throw CreateError(ErrorCodes.UNAUTHORIZED);
            return null
        }
        return idToken
    }

    private validateAdminToken = (req: Request) => {
        const idToken = this.getIdToken(req);
        if ( !idToken ) {
            return null;
        }

        try {
            return verifyJWT(idToken);
        }
        catch(error) {
            console.error('Error while verifying Admin ID token:', error);
            return null;
        }
    }

    private validateFirebaseIdToken = async (req: Request) => {
        const idToken = this.getIdToken(req);
        if ( !idToken ) {
            return null;
        }

        try {
            const decodedIdToken = await admin.auth().verifyIdToken(idToken);
            // console.log('ID Token correctly decoded', decodedIdToken);
            return decodedIdToken;
        } catch (error) {
            console.error('Error while verifying Firebase ID token:', error);
            // throw CreateError(ErrorCodes.UNAUTHORIZED);
            return null
        }
    }
}

export default new RpcController()
