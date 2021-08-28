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
const path = require("path");
const utils_1 = require("../../commons/utils");
const globals_1 = require("../../commons/globals");
const model_1 = require("./model");
const sequelize_1 = require("sequelize");
const logger_1 = require("../../commons/logger");
class RDB {
    initialize(dbOpt) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.db = new sequelize_1.Sequelize(dbOpt.database, dbOpt.username, dbOpt.password, Object.assign(Object.assign({}, dbOpt.conn), { logging: msg => logger_1.logger.debug(msg) }));
            // await this.db.authenticate();
            yield this.syncDefine('mysql');
            logger_1.logger.info(`${(_a = dbOpt.conn) === null || _a === void 0 ? void 0 : _a.dialect} is ready.`);
            return this.db;
        });
    }
    syncDefine(dialect) {
        return __awaiter(this, void 0, void 0, function* () {
            const models = {};
            const dir = path.join(__dirname, '..', dialect, '/models/');
            (0, utils_1.getFiles)(dir, (dir, file) => {
                if (!!this.db) {
                    // const model: any = this.db.import(path.join(dir, file));
                    const model = require(path.join(dir, file)).default(this.db);
                    models[(0, utils_1.capitalize)(model.getName())] = model;
                }
            });
            if (!!this.db) {
                yield this.db.sync();
            }
            // @ts-ignore
            globals_1.dbs = Object.assign(globals_1.dbs, models);
            for (const i in globals_1.dbs) {
                if (globals_1.dbs.hasOwnProperty(i)) {
                    const db = globals_1.dbs[i];
                    if (db instanceof model_1.default) {
                        yield db.afterSync();
                    }
                }
            }
        });
    }
}
exports.default = RDB;
//# sourceMappingURL=rdb.js.map