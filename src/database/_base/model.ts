import { Sequelize, Transaction } from 'sequelize';
import PQueue from 'p-queue';
import { logger } from '../../commons/logger';


abstract class Model {
    protected db!: Sequelize;
    protected model: any;
    protected name: string = '';
    protected attributes: object = {};
    protected options: object = {};
    static queue: PQueue = new PQueue();


    constructor(rdb: Sequelize) {
        this.initialize();

        this.db = rdb;
        this.model = rdb.define(
            this.name,
            { ...this.attributes },
            {
                ...{
                    underscored: true,
                    paranoid: true,
                    timestamps: true,
                },
                ...this.options
            });
    }

    protected abstract initialize() : void;

    public getName() : string { return this.name }

    public async afterSync() { logger.info(`[table] ${this.name} synced.`) }

    public async getTransaction(callback: Function) {
        if( !this.model ) {
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
        return Model.queue.add(() => this.model.sequelize.transaction((transaction: Transaction) => callback(transaction)));
    }


    public async create(values: object, transaction?: Transaction) { return this.model.create(values, {transaction}) }
    public async update(values: object, where: object, transaction?: Transaction) { return this.model.update(values, { where, transaction }) }
    public async destroy(where: object, transaction?: Transaction) { return this.model.destroy({ where, transaction }) }
    public async findOne(where: object, transaction?: Transaction) { return this.model.findOne({ where, transaction }) }
    public async findAll(where: object, options?: object, transaction?: Transaction) { return this.model.findAll({ where, ...options, transaction }) }
    public async findAndCountAll(where: object, options?: object, transaction?: Transaction) { return this.model.findAndCountAll({ where, ...options, transaction }) }
    public async findOrCreate(findOption: object, createOption?: object, transaction?: Transaction) {
        let isNew = false;
        let record = await this.model.findOne({
            where: {
                ...findOption
            },
            transaction
        });
        if( !record ) {
            record = await this.model.create({
                ...(createOption || findOption)
            }, {transaction});
            isNew = true;
        }

        return {
            record,
            isNew,
        };
    }

    public async bulkCreate(bulk: [], options?: any) {
        return (await this.model.bulkCreate(bulk, options))
            .map((d: any) => d.get({plain: true}));
    }

}



export default Model;
