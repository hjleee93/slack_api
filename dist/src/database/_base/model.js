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
const p_queue_1 = require("p-queue");
const logger_1 = require("../../commons/logger");
class Model {
    constructor(rdb) {
        this.name = '';
        this.attributes = {};
        this.options = {};
        this.initialize();
        this.db = rdb;
        this.model = rdb.define(this.name, Object.assign({}, this.attributes), Object.assign({
            underscored: true,
            paranoid: true,
            timestamps: true,
        }, this.options));
    }
    getName() { return this.name; }
    afterSync() {
        return __awaiter(this, void 0, void 0, function* () { logger_1.logger.info(`[table] ${this.name} synced.`); });
    }
    getTransaction(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.model) {
                throw new Error('invalid model');
            }
            // return this.model.sequelize.transaction(async (transaction?: Transaction) => {
            //     return await callback(transaction);
            // });
            // await this.model.sequelize.transaction({
            //     isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
            // }, async (transaction?: Transaction) => {
            //     return await callback(transaction);
            // })
            return Model.queue.add(() => this.model.sequelize.transaction((transaction) => callback(transaction)));
        });
    }
    create(values, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.create(values, { transaction }); });
    }
    update(values, where, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.update(values, { where, transaction }); });
    }
    destroy(where, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.destroy({ where, transaction }); });
    }
    findOne(where, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.findOne({ where, transaction }); });
    }
    findAll(where, options, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.findAll(Object.assign(Object.assign({ where }, options), { transaction })); });
    }
    findAndCountAll(where, options, transaction) {
        return __awaiter(this, void 0, void 0, function* () { return this.model.findAndCountAll(Object.assign(Object.assign({ where }, options), { transaction })); });
    }
    findOrCreate(findOption, createOption, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let isNew = false;
            let record = yield this.model.findOne({
                where: Object.assign({}, findOption),
                transaction
            });
            if (!record) {
                record = yield this.model.create(Object.assign({}, (createOption || findOption)), { transaction });
                isNew = true;
            }
            return {
                record,
                isNew,
            };
        });
    }
    bulkCreate(bulk, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.model.bulkCreate(bulk, options))
                .map((d) => d.get({ plain: true }));
        });
    }
}
Model.queue = new p_queue_1.default();
exports.default = Model;
//# sourceMappingURL=model.js.map