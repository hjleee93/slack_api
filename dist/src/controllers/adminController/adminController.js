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
const globals_1 = require("../../commons/globals");
const errorCodes_1 = require("../../commons/errorCodes");
const utils_1 = require("../../commons/utils");
const _ = require("lodash");
const uuid_1 = require("uuid");
class AdminController {
    login(params, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            const { account, password } = params;
            const record = yield globals_1.dbs.Admin.findOne({ account });
            if (!record) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_USERNAME);
            }
            if (!utils_1.verifyPassword(password, record.password)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PASSWORD);
            }
            if (!record.activated) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_ADMIN);
            }
            const access_token = utils_1.signJWT({
                is_admin: true,
                id: record.id,
                uid: record.uid,
                account: record.account,
                name: record.name,
                level: record.level,
                sub_level: record.sub_level,
            }, '1d');
            const refresh_token = utils_1.signJWT({
                is_admin: true,
                id: record.id,
                account: record.account,
                name: record.name,
                level: record.level,
                sub_level: record.sub_level,
            }, '30d');
            yield globals_1.dbs.AdminRefreshToken.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                let r = yield globals_1.dbs.AdminRefreshToken.findOne({ admin_id: record.id }, transaction);
                if (r) {
                    r.token = refresh_token;
                    yield r.save({ transaction });
                }
                else {
                    r = yield globals_1.dbs.AdminRefreshToken.create({ admin_id: record.id, token: refresh_token }, transaction);
                }
            }));
            return {
                access_token,
                refresh_token,
            };
        });
    }
    logout(params, admin) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getAccessTokens(params, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = params;
            const access_token = yield globals_1.dbs.AdminRefreshToken.refresh(token);
            return {
                access_token,
            };
        });
    }
    verifyToken({}, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                id: admin.id,
                name: admin.name,
                level: admin.level,
                sub_level: admin.sub_level,
            };
        });
    }
    /**
     * 관리자
     */
    getAdminLogs({ admin_id, limit = 50, offset = 0, sort = 'id', dir = 'asc' }, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            const { count, rows } = yield globals_1.dbs.AdminLog.getLogs({ admin_id, limit, offset, sort, dir });
            return {
                count,
                logs: _.map(rows, (row) => {
                    const admin = row.admin;
                    return {
                        id: row.id,
                        admin: {
                            id: admin.id,
                            account: admin.account,
                            name: admin.name,
                            level: admin.level,
                            sub_level: admin.sub_level,
                        },
                        path: row.path,
                        body: JSON.parse(row.body),
                        created_at: row.created_at,
                        updated_at: row.updated_at,
                    };
                })
            };
        });
    }
    getAdmins({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            const { count, rows } = yield globals_1.dbs.Admin.findAndCountAll({}, {
                attributes: {
                    exclude: ['password']
                },
                order: [[sort, dir]],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            });
            return {
                count,
                admins: _.map(rows, record => record.get({ plain: true }))
            };
        });
    }
    addAdmin({ account, name, password, level, sub_level }, { id, uid }) {
        return __awaiter(this, void 0, void 0, function* () {
            const admin = yield globals_1.dbs.Admin.findOne({ id });
            if (admin.level < 10) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_LEVEL);
            }
            level = _.toNumber(level);
            if (isNaN(level) || level >= 10 || level < 1) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PARAMS);
            }
            sub_level = _.toNumber(level);
            if (isNaN(sub_level) || sub_level >= 10 || sub_level < 0) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PARAMS);
            }
            const record = yield globals_1.dbs.Admin.findOne({ account });
            if (record) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_USERNAME);
            }
            yield globals_1.dbs.Admin.model.create({
                uid: uuid_1.v4(),
                account,
                name,
                level,
                sub_level,
                password: utils_1.makePassword(password),
            });
        });
    }
    updateAdmin({ id: target_id, name, password, level, sub_level, activated }, { id, level: order_level, sub_level: order_sub_level }) {
        return __awaiter(this, void 0, void 0, function* () {
            target_id = _.toNumber(target_id);
            const admin = yield globals_1.dbs.Admin.findOne({ id: target_id });
            if (!admin) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PARAMS);
            }
            if (order_level === 10 && id !== target_id) {
                if (level) {
                    level = _.toNumber(level);
                    if (isNaN(level) || level >= 10 || level < 1) {
                        throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PARAMS);
                    }
                    admin.level = level || admin.level;
                }
                if (sub_level) {
                    sub_level = _.toNumber(sub_level);
                    if (isNaN(sub_level) || level >= 10 || level < 0) {
                        throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_ADMIN_PARAMS);
                    }
                    admin.sub_level = sub_level || admin.sub_level;
                }
                if (activated) {
                    admin.activated = (activated === 'true');
                }
            }
            if (id === target_id) {
                admin.password = password ? utils_1.makePassword(password) : admin.password;
                admin.name = name || admin.name;
            }
            yield admin.save();
        });
    }
}
exports.default = new AdminController();
//# sourceMappingURL=adminController.js.map