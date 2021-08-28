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
const model_1 = require("../../../_base/model");
const sequelize_1 = require("sequelize");
const globals_1 = require("../../../../commons/globals");
class UserModel extends model_1.default {
    initialize() {
        this.name = 'user';
        this.attributes = {
            user_id: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
            user_name: sequelize_1.DataTypes.STRING,
        };
    }
    afterSync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.hasMany(globals_1.dbs.WorkLog.model, { sourceKey: 'user_id', foreignKey: 'user_id' });
        });
    }
    get({ battle_uid }, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.model.findOne({
                where: {
                    uid: battle_uid,
                },
                include: [{
                        model: globals_1.dbs.User.model,
                        attributes: ['uid', 'name', 'picture'],
                    }, {
                        model: globals_1.dbs.Game.model,
                        attributes: ['uid', 'pathname', 'title', 'version', 'control_type', 'url_game', 'url_thumb', 'url_thumb_webp', 'url_thumb_gif']
                    }]
            });
            return record.get({ plain: true });
        });
    }
    getInfo(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.model.findOne({
                where: { uid },
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                },
                include: [{
                        model: globals_1.dbs.User.model,
                        as: 'host',
                        attributes: {
                            exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                        },
                    }, {
                        model: globals_1.dbs.Game.model,
                        attributes: {
                            exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                        },
                        include: [{
                                model: globals_1.dbs.User.model,
                                attributes: {
                                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                                },
                                required: true,
                            }],
                    }]
            });
            return record.get({ plain: true });
        });
    }
}
exports.default = (rdb) => new UserModel(rdb);
//# sourceMappingURL=user.js.map