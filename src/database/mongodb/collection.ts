import * as mongoose from 'mongoose';
import { ClientSession, Model, Schema, SchemaDefinition } from 'mongoose';
import { Db } from 'mongodb';


export default abstract class Collection {
    protected attributes: SchemaDefinition = {};
    protected schema!: Schema;
    protected model!: Model<any>
    protected name!: string;
    // private db!: Db;


    constructor() {
        this.initialize();
        this.attributes.deleted_at = { type: String };
        this.schema = new Schema(this.attributes, {versionKey: false, timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});
        this.model = mongoose.model(this.name, this.schema);
    }
    protected abstract initialize (): void;

    getName () { return this.name }

    async afterSync() {}
    async getTransaction(callback: Function) {
        // const session = await this.model.startSession();
        // await session.withTransaction(async () => {
        //     await callback(session);
        // })
        const session = await mongoose.startSession();
        session.startTransaction();
        await callback(session);
        session.endSession();
    }


    async create(query: any, session: ClientSession) {
        return this.model.create([query], { session })
    }
    async findOne(query: any, options?: any) { query.deleted_at = null; return this.model.findOne(query, null, options) }
    async findAll(query: any, options?: any) { query.deleted_at = null; return this.model.find(query, null, options) }
    async destroy(query: any) { await this.model.updateOne(query, { deleted_at: Date.now() }) }
    async bulkCreate(bulk: any[], options?: any) { await this.model.insertMany(bulk) }
}
