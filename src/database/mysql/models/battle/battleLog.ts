import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class BattleLogModel extends Model {
    protected initialize() {
        this.name = 'battleLog';
        this.attributes = {
            battle_uid:     { type: DataTypes.STRING(36), allowNull: false },
            battle_user_id: { type: DataTypes.INTEGER, allowNull: false },
            score:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, {foreignKey: 'user_uid', targetKey: 'uid'});
        this.model.belongsTo(dbs.Battle.model, {foreignKey: 'battle_uid', targetKey: 'uid'});
    }


    async updateScore({ id, score }: any, transaction?: Transaction) {
        return this.update({ score }, { id }, transaction);
    }

}

export default (rdb: Sequelize) => new BattleLogModel(rdb);
