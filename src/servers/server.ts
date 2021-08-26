import * as express from 'express';
import * as expressWs from 'express-ws';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as path from 'path';
import * as ejs from 'ejs';
import * as ws from 'ws';

import { Request, Response, Router } from 'express';
import {  } from 'express-ws'
import { Sequelize } from 'sequelize';


import MySql from '../database/mysql';
import Redis from '../database/redis';

import { IMessageQueueOptions, IServerOptions } from '../commons/interfaces';
import * as Pkg from '../../package.json';

import dbOptions from '../../config/dbs';

import cfgOption from '../../config/opt';
import {logger} from "../commons/logger";
const { CORS } = cfgOption;


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

        this.setExpress(options);
        options.rdb && await this.setRDB();
        options.mdb && await this.setMDB();
        options.ejs && this.setEJS();
    }


    protected setEJS() {
        if ( !!this.app ) {
            this.app.set('views', path.join(__dirname, '..', '..', '/views'));
            this.app.set('view engine', 'ejs');
            this.app.engine('html', ejs.renderFile);
        }
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
        await Redis.initialize();
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
            logger.info(`[${process.env.NODE_ENV || 'local'}] Api Server [ver.${Pkg.version}] has started. (port: ${port})`)
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
