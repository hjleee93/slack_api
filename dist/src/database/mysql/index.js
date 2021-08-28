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
const MYSQL = require('mysql2');
const rdb_1 = require("../_base/rdb");
const dbs_1 = require("../../../config/dbs");
const mysqlOpt = dbs_1.default.mysql;
class MySql extends rdb_1.default {
    initialize(dbOpt, charSet = 'utf8', collate = 'utf8_general_ci') {
        const _super = Object.create(null, {
            initialize: { get: () => super.initialize }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const connection = yield MYSQL.createConnection({
                host: dbOpt.conn.host,
                port: dbOpt.conn.port,
                user: dbOpt.username,
                password: dbOpt.password,
            });
            yield connection.execute(`CREATE DATABASE IF NOT EXISTS ${mysqlOpt.database} CHARACTER SET ${charSet} COLLATE ${collate};`);
            return _super.initialize.call(this, dbOpt);
            // try {
            // const connection = await MYSQL.createConnection({
            //     host:       mysqlOpt.conn.host,
            //     port:       mysqlOpt.conn.port,
            //     user:       mysqlOpt.username,
            //     password:   mysqlOpt.password,
            // } as any);
            //
            // await connection.execute(`CREATE DATABASE IF NOT EXISTS ${mysqlOpt.database} CHARACTER SET utf8 COLLATE utf8_general_ci;`);
            //
            // this.db = new Sequelize(mysqlOpt.database, mysqlOpt.username, mysqlOpt.password, {
            //     ...mysqlOpt.conn,
            //     logging: msg => logger.debug(msg)
            // });
            //
            // await this.db.authenticate();
            // await this.syncDefine();
            // logger.info('mysql is ready.'.cyan)
            //
            // return this.db;
            // }
            // catch (e) {
            //     console.error(e.stack);
            // }
        });
    }
}
exports.default = new MySql();
//# sourceMappingURL=index.js.map