import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';

class BattleModel extends Model {
    protected initialize(): void {
        this.name = 'battle'
        this.attributes = {
            uid:        { type: DataTypes.STRING(36), allowNull: false },
            user_uid:   { type: DataTypes.STRING(36), allowNull: false },
            game_id:    { type: DataTypes.INTEGER, allowNull: false },
            title:      { type: DataTypes.STRING(50) },
            activated:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            user_count: { type: DataTypes.MEDIUMINT, allowNull: false, defaultValue: 0 },
            end_at:     { type: DataTypes.DATE },
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid', as: 'host' });
        this.model.belongsTo(dbs.Game.model, { foreignKey: 'game_id', targetKey: 'id' });
    }


    async get({ battle_uid }: { battle_uid: string }, transaction?: Transaction) {
        const record = await this.model.findOne({
            where: {
                uid: battle_uid,
            },
            include: [{
                model: dbs.User.model,
                attributes: ['uid', 'name', 'picture'],
            }, {
                model: dbs.Game.model,
                attributes: ['uid', 'pathname', 'title', 'version', 'control_type', 'url_game', 'url_thumb', 'url_thumb_webp', 'url_thumb_gif']
            }]
        });

        return record.get({ plain: true });
    }


    async getInfo(uid: string) {
        const record = await this.model.findOne({
            where: { uid },
            attributes: {
                exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
            },
            include: [{
                model: dbs.User.model,
                as: 'host',
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                },
            }, {
                model: dbs.Game.model,
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
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
}


export default (rdb: Sequelize) => new BattleModel(rdb);
