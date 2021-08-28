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
class BookingModel extends model_1.default {
    initialize() {
        this.name = 'booking';
        this.attributes = {
            user_id: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            room_number: { type: sequelize_1.DataTypes.STRING },
            title: { type: sequelize_1.DataTypes.STRING },
            description: { type: sequelize_1.DataTypes.STRING },
            date: { type: sequelize_1.DataTypes.STRING },
            start: { type: sequelize_1.DataTypes.STRING },
            end: { type: sequelize_1.DataTypes.STRING },
        };
    }
    afterSync() {
        return __awaiter(this, void 0, void 0, function* () {
            this.model.hasMany(globals_1.dbs.Participant.model, { sourceKey: 'id', foreignKey: 'booking_id' });
        });
    }
    hasBookingOnDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.findAll({ date: date });
            return result;
        });
    }
    hasBookingAtTime(time) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.findAll({ start: time });
            return result;
        });
    }
}
exports.default = (rdb) => new BookingModel(rdb);
//# sourceMappingURL=booking.js.map