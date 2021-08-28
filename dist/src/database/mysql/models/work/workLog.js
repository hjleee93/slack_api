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
const moment = require("moment-timezone");
class WorkLogModel extends model_1.default {
    initialize() {
        this.name = 'workLog';
        this.attributes = {
            user_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            start: {
                type: sequelize_1.DataTypes.DATE,
            },
            end: {
                type: sequelize_1.DataTypes.DATE,
            },
        };
    }
    afterSync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.belongsTo(globals_1.dbs.User.model, { foreignKey: 'user_id', targetKey: 'user_id' });
        });
    }
    hasWorkStart(user_id, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({
                where: {
                    user_id,
                    start: {
                        //범위
                        [sequelize_1.Op.gte]: moment().format('yyyy-MM-DD').toString(),
                        [sequelize_1.Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                    }
                }
            });
        });
    }
    hasWorkEnd(user_id, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.model.findOne({
                where: {
                    user_id,
                    end: {
                        //범위
                        [sequelize_1.Op.gte]: moment().format('yyyy-MM-DD').toString(),
                        [sequelize_1.Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                    }
                }
            });
        });
    }
}
exports.default = (rdb) => new WorkLogModel(rdb);
//# sourceMappingURL=workLog.js.map