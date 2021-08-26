import { v4 as uuid } from 'uuid';
import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


interface ISharedParams {
    user_uid: string,
    game_id: number,
}

class SharedGameModel extends Model {
    protected initialize(): void {
        this.name = 'sharedGame';
        this.attributes = {
            uid:        { type: DataTypes.STRING(36), allowNull: false, unique: true },
            user_uid:   { type: DataTypes.STRING(36), allowNull: false, unique: 'compositeIndex' },
            game_id:    { type: DataTypes.INTEGER, allowNull: false, unique: 'compositeIndex' },
            count_open: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            count_play: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            count_ad:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }
    }


    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid' })
        this.model.belongsTo(dbs.Game.model, { foreignKey: 'game_id', targetKey: 'id' })
    }


    async getInfo(where: object) {
        const record = await this.model.findOne({
            where,
            attributes: {
                exclude: ['id', 'created_at', 'updated_at', 'deleted_at'],
            },
            include: [{
                model: dbs.User.model,
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at'],
                },
            }, {
                model: dbs.Game.model,
                attributes: {
                    exclude: ['created_at', 'updated_at', 'deleted_at'],
                },
                include: [{
                    model: dbs.User.model,
                    attributes: {
                        exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                    },
                    required: true,
                }],
            }]
        })

        return record.get({ plain: true })
    }


    async getSharedUid({ user_uid, game_id }: ISharedParams) {
        let record = await this.findOne({ user_uid, game_id });
        if ( !record ) {
            record = await this.create({
                uid: uuid(),
                user_uid,
                game_id,
            })
        }

        return record.uid
    }
}


export default (rdb: Sequelize) => new SharedGameModel(rdb)
