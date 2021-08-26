import * as _ from 'lodash';
import Model from '../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../commons/globals';
import { ITimelineParams } from "../../../controllers/_interfaces";


/**
 * 플랫폼 서비스 내에서 발생하는 사용자의 행동 결과
 */

class TimelineModel extends Model {
    protected initialize() {
        this.name = 'timeline';
        this.attributes = {
            uid:            { type: DataTypes.STRING(36), allowNull: false },
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            game_id:        { type: DataTypes.INTEGER, allowNull: false },
            type:           { type: DataTypes.SMALLINT, allowNull: false },
            extra:          { type: DataTypes.STRING(200) },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_id', targetKey: 'id' });
        this.model.belongsTo(dbs.Game.model, { foreignKey: 'game_id', targetKey: 'id' });
    }


    async getList({user_id, limit = 50, offset = 0}: ITimelineParams, transaction?: Transaction) {
        const records = await this.model.findAll({
            where: {
                user_id,
            },
            attributes: {
                exclude: ['updated_at', 'deleted_at']
            },
            order: [['id', 'desc']],
            include: [{
                model: dbs.User.model,
                attributes: [['uid', 'user_uid'], 'name', 'picture'],
                required: true,
            }, {
                model: dbs.Game.model,
                attributes: {
                    exclude: ['id', 'created_at', 'updated_at', 'deleted_at']
                }
            }],
            limit,
            offset,
            transaction
        });

        return _.map(records, (record: any) => record.get({ plain: true }));
    }

}

export default (rdb: Sequelize) => new TimelineModel(rdb);
