"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const express = require("express");
const expressWs = require("express-ws");
const bodyParser = require("body-parser");
const path = require("path");
const ejs = require("ejs");
const sequelize_1 = require("sequelize");
const admin = require("firebase-admin");
const globals_1 = require("../commons/globals");
const mysql_1 = require("../database/mysql");
const Pkg = require("../../package.json");
const globals_2 = require("../commons/globals");
const dbs_1 = require("../../config/dbs");
const opt_1 = require("../../config/opt");
const { CORS } = opt_1.default;
// graph-ql
const graphql_1 = require("graphql");
const graphqlHTTP = require("express-graphql");
// import swaggerDef from './swaggerDef';
// colors
const colors = require("colors");
const logger_1 = require("../commons/logger");
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
class Server {
    constructor() {
        this.initialize = (options) => __awaiter(this, void 0, void 0, function* () {
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
        });
        this.initialize2 = (options) => __awaiter(this, void 0, void 0, function* () {
            this.options = options;
            options.firebase && this.setFirebase();
            this.setExpress(options);
            options.rdb && (yield this.setRDB());
            options.mdb && (yield this.setMDB());
            options.ejs && this.setEJS();
            options.swagger && this.setSwagger();
            options.graphql && this.setGraphQL();
        });
        this.start = () => __awaiter(this, void 0, void 0, function* () {
            yield this.beforeStart();
            // const port = await getPort({ port: getPort.makeRange(this.options.port, this.options.port+100)});
            const port = this.options.port;
            const errorCallback = (err) => {
                if (err) {
                    console.error(err.stack);
                    return;
                }
                this.started_at = new Date();
                logger_1.logger.info(`[${process.env.NODE_ENV || 'local'}] Api Server [ver.${Pkg.version}] has started. (port: ${port})`.cyan.bold);
            };
            if (!!this.app) {
                this.app.listen(port, errorCallback);
            }
            yield this.afterStart();
        });
        this.beforeStart = () => __awaiter(this, void 0, void 0, function* () {
        });
        this.afterStart = () => __awaiter(this, void 0, void 0, function* () {
            //
        });
    }
    setEJS() {
        if (!!this.app) {
            this.app.set('views', path.join(__dirname, '..', '..', '/views'));
            this.app.set('view engine', 'ejs');
            this.app.engine('html', ejs.renderFile);
        }
    }
    setSwagger() {
        if (!!this.app && process.env.NODE_ENV !== 'production') {
            const options = {
            // explorer: true
            };
            // this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDef, options));
        }
    }
    setGraphQL() {
        if (!!this.app) {
            const models = {
                Sequelize: sequelize_1.Sequelize,
                sequelize: this.db,
            };
            _.forEach(globals_2.dbs, (db) => {
                db.model.graphql = { queries: {} };
                db.model.graphql.queries[`${db.name}Count`] = { resolver: (_, where) => Promise.resolve(db.model.count(where)) };
                models[db.name] = db.model;
            });
            // models.Sequelize = Sequelize;
            const options = {
                authorizer: (source, args, context, info) => {
                    try {
                        // const idToken = getIdToken(context as Request);
                        // const admin = verifyJWT(idToken)
                        // if ( !admin ) {
                        //
                        // }
                        return Promise.resolve();
                    }
                    catch (e) {
                        return Promise.reject(e);
                    }
                }
            };
            const { generateSchema } = require('sequelize-graphql-schema')(options);
            const schema = generateSchema(models);
            const hooker = (req, res, next) => {
                var _a, _b;
                if (req.method.toUpperCase() !== 'GET' && ((_b = (_a = req.body) === null || _a === void 0 ? void 0 : _a.query) === null || _b === void 0 ? void 0 : _b.includes('Post'))) {
                    // return adminTracking(req, res, next);
                }
                next();
            };
            this.app.use('/graphql', hooker, graphqlHTTP({
                schema: new graphql_1.GraphQLSchema(schema),
                graphiql: true
            }));
        }
    }
    setFirebase() {
        let serviceAccount;
        if (process.env.NODE_ENV === 'production') {
            serviceAccount = require('../../config/firebase/service-account.json');
        }
        else {
            serviceAccount = require('../../config/firebase/zempie-dev-firebase-adminsdk-mt5jv-9e05cbc8f2.json');
        }
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: 'https://zempie.firebaseio.com'
        });
        globals_1.firebase.admin = admin;
    }
    setMessageQueue(options) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    setExpress(options) {
        this.app = express();
        if (this.app) {
            if (!!options.static_path && options.static_path instanceof Array) {
                options.static_path.forEach((obj) => {
                    if (this.app) {
                        this.app.use(obj.path, express.static(obj.route));
                    }
                });
            }
            // this.app.use(cors({ credentials: true, origin: CORS.allowedOrigin }));
            this.app.use(bodyParser.json());
            this.app.use(bodyParser.urlencoded({ extended: false }));
            options.tcp && this.setTcp();
            this.routes(this.app);
        }
    }
    setRDB() {
        return __awaiter(this, void 0, void 0, function* () {
            this.db = yield mysql_1.default.initialize(dbs_1.default.mysql);
        });
    }
    setMDB() {
        return __awaiter(this, void 0, void 0, function* () {
            // await Redis.initialize();
            // await Mongo.initialize();
        });
    }
    setTcp() {
        if (this.app) {
            const instance = expressWs(this.app);
            this.wss = instance.getWss();
        }
    }
    routes(app) {
        // app.use((req, res, next) => {
        //     next();
        // });
        app.get('/test', (req, res) => {
            const status = {
                Started_At: this.started_at.toLocaleString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            };
            res.send(status);
        });
        // const apiVer = '/api/v1';
        // app.post(`${apiVer}/rpc`, RpcController.routeRpc);
    }
}
exports.default = Server;
//# sourceMappingURL=server.js.map