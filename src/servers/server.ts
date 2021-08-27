import * as _ from 'lodash';
import * as express from 'express';
import * as expressWs from 'express-ws';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';
import * as ejs from 'ejs';
import * as ws from 'ws';
import * as getPort from 'get-port';

import { Request, Response, Router } from 'express';
import {  } from 'express-ws'
import { Sequelize } from 'sequelize';

import * as admin from 'firebase-admin';
import { firebase } from '../commons/globals';

import MySql from '../database/mysql';

import { IMessageQueueOptions, IServerOptions } from '../commons/interfaces';
import * as Pkg from '../../package.json';

import { dbs } from '../commons/globals';
import dbOptions from '../../config/dbs';

import cfgOption from '../../config/opt';
const { CORS } = cfgOption;


// graph-ql
import { GraphQLSchema } from 'graphql';
import * as graphqlHTTP from 'express-graphql';
// const { generateSchema } = require('sequelize-graphql-schema')();

// swagger
import * as swaggerUi from 'swagger-ui-express'
// import swaggerDef from './swaggerDef';

// colors
import * as colors from 'colors';
import { logger } from '../commons/logger';

// import { adminTracking, getIdToken, validateAdminIdToken } from '../routes/_common';
import { IncomingMessage } from 'http';
import { verifyJWT } from '../commons/utils';

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});


export default class Server {
    protected options!: IServerOptions;
    protected app?: express.Application;
    protected wss?: ws.Server;
    private started_at!: Date;
    private db?: Sequelize


    public initialize = async (options: IServerOptions) => {
        this.options = options;

        // this.setFirebase();
        // this.setDeployApp();
        //
        this.setExpress(options);
        //
        // await Server.setRDB();
        //
        // // this.setEJS();
        // this.setSwagger();
        // this.setGraphQL();

        // if ( !!this.app ) {
        //     this.routes(this.app);
        // }
    }
    public initialize2 = async (options: IServerOptions) => {
        this.options = options;

        options.firebase && this.setFirebase();
        this.setExpress(options);
        options.rdb && await this.setRDB();
        options.mdb && await this.setMDB();
        options.ejs && this.setEJS();
        options.swagger && this.setSwagger();
        options.graphql && this.setGraphQL();
    }


    protected setEJS() {
        if ( !!this.app ) {
            this.app.set('views', path.join(__dirname, '..', '..', '/views'));
            this.app.set('view engine', 'ejs');
            this.app.engine('html', ejs.renderFile);
        }
    }


    protected setSwagger() {
        if ( !!this.app && process.env.NODE_ENV !== 'production' ) {
            const options = {
                // explorer: true
            };
            // this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDef, options));
        }
    }


    protected setGraphQL() {
        if ( !!this.app ) {
            const models: any = {
                Sequelize,
                sequelize: this.db,
            };
            _.forEach(dbs, (db: any) => {
                db.model.graphql = { queries: {} };
                db.model.graphql.queries[`${db.name}Count`] = { resolver: (_: any, where: any) => Promise.resolve(db.model.count(where)) };
                models[db.name] = db.model;
            });
            // models.Sequelize = Sequelize;

            const options = {
                authorizer: (source: any, args: any, context: IncomingMessage, info: any) => {
                    try {
                        // const idToken = getIdToken(context as Request);
                        // const admin = verifyJWT(idToken)
                        // if ( !admin ) {
                        //
                        // }

                        return Promise.resolve();
                    }
                    catch (e) {
                        return  Promise.reject(e);
                    }
                }
            }
            const { generateSchema } = require('sequelize-graphql-schema')(options);
            const schema = generateSchema(models);
            const hooker: any = (req: Request, res: Response, next: any) => {
                if ( req.method.toUpperCase() !== 'GET' && req.body?.query?.includes('Post') ) {
                    // return adminTracking(req, res, next);
                }
                next();
            };
            this.app.use('/graphql', hooker, graphqlHTTP({
                schema: new GraphQLSchema(schema),
                graphiql: true
            }));
        }
    }


    protected setFirebase() {
        let serviceAccount;
        if ( process.env.NODE_ENV === 'production' ) {
            serviceAccount = require('../../config/firebase/service-account.json');
        }
        else {
            serviceAccount = require('../../config/firebase/zempie-dev-firebase-adminsdk-mt5jv-9e05cbc8f2.json');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: 'https://zempie.firebaseio.com'
        });

        firebase.admin = admin;
    }


    protected async setMessageQueue(options: IMessageQueueOptions) {
        // await Producer.connect()
        // await Consumer.connect(options.groupId, options.autoCommit, options.onMessage)
        // Consumer.addTopic(options.addTopics);
        // await Kafka.initialize(options.groupId);
        // if ( options.addTopics ) {
        //     await Kafka.addTopics(options.addTopics);
        // }
        // if ( options.addGateways ) {
        //     await Kafka.addGateways(options.addGateways);
        // }
        // await Kafka.run(options.eachMessage);
    }



    protected setExpress(options : IServerOptions) : void {
        this.app = express();
        if ( this.app ) {
            if ( !!options.static_path && options.static_path instanceof Array ) {
                options.static_path.forEach((obj: any) => {
                    if ( this.app ) {
                        this.app.use(obj.path, express.static(obj.route));
                    }
                })
            }

            this.app.use(cors({ credentials: true, origin: CORS.allowedOrigin }));
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended:false }));

            options.tcp && this.setTcp();
            this.routes(this.app);
        }
    }



    protected async setRDB() {
        this.db = await MySql.initialize(dbOptions.mysql);
    }


    protected async setMDB() {
        // await Redis.initialize();
        // await Mongo.initialize();
    }


    protected setTcp() {
        if ( this.app ) {
            const instance = expressWs(this.app);
            this.wss = instance.getWss()
        }
    }



    protected routes(app: Router) {
        // app.use((req, res, next) => {
        //     next();
        // });

        app.get('/test', (req, res) => {
            const status = {
                Started_At: this.started_at.toLocaleString('ko-KR',
                    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            }
            res.send(status);
        });

        // const apiVer = '/api/v1';
        // app.post(`${apiVer}/rpc`, RpcController.routeRpc);
    }



    public start = async () : Promise<void> => {
        await this.beforeStart();

        // const port = await getPort({ port: getPort.makeRange(this.options.port, this.options.port+100)});
        const port = this.options.port;
        const errorCallback: any = (err: Error) => {
            if ( err ) {
                console.error(err.stack);
                return
            }

            this.started_at = new Date();
            logger.info(`[${process.env.NODE_ENV || 'local'}] Api Server [ver.${Pkg.version}] has started. (port: ${port})`.cyan.bold)
        };

        if ( !!this.app ) {
            this.app.listen(port, errorCallback);
        }

        await this.afterStart();
    }

    protected beforeStart = async(): Promise<void> => {
    }

    protected afterStart = async (): Promise<void> => {
        //
    }
}
