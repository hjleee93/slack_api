import * as _ from 'lodash';
import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction, Op } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class BattleUserModel extends Model {
    protected initialize() {
        this.name = 'battleUser';
        this.attributes = {
            battle_uid:     { type: DataTypes.STRING(36), allowNull: false },
            user_uid:       { type: DataTypes.STRING(36), allowNull: false },
            name:           { type: DataTypes.STRING(20), defaultValue: 'noname' },
            best_score:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, {foreignKey: 'user_uid', targetKey: 'uid'});
        this.model.belongsTo(dbs.Battle.model, {foreignKey: 'battle_uid', target: 'uid'});
    }



    async updateBestScore({ battle_uid, user_uid, best_score }: any, transaction?: Transaction) {
        return this.update({ best_score }, {
                battle_uid,
                user_uid,
            }, transaction);
    }


    async updateUserName({ battle_uid, user_uid, name }: any, transaction?: Transaction) {
        return this.update({ name }, {
                battle_uid,
                user_uid,
            }, transaction);
    }


    async getRanking({ battle_uid }: any, transaction?: Transaction) {
        const records = await this.findAll({
            battle_uid,
            best_score: {
                [Op.gt]: 0,
            }
        }, {
            attributes: {
                exclude: ['deleted_at']
            },
            include: [{
                model: dbs.User.model,
            }],
            order: [['best_score', 'desc']],
        }, transaction);

        return _.map(records, (record: any, i: number) => {
            const user = record.user;
            return {
                ranking: i + 1,
                user_uid: record.user_uid,
                name: user? user.name : record.name,
                picture: user? user.picture : null,
                channel_id: user? user.channel_id : null,
                score: record.best_score,
            }
        })
    }
}

export default (rdb: Sequelize) => new BattleUserModel(rdb);
