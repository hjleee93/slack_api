import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


/**
 * 플랫폼 서비스 내에서 발생하는 사용자의 게임 결과
 * 모든 게임 로그
 */

class GameLogModel extends Model {
    protected initialize() {
        this.name = 'gameLog';
        this.attributes = {
            user_uid:       { type: DataTypes.STRING(36) },
            game_id:        { type: DataTypes.INTEGER, allowNull: false },
            score:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            playtime:       { type: DataTypes.INTEGER, allowNull: false },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, {foreignKey: 'user_uid', targetKey: 'uid'});
    }



}

export default (rdb: Sequelize) => new GameLogModel(rdb);
