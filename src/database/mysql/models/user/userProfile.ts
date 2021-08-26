import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


/**
 * 플랫폼 서비스 내에서 발생하는 사용자 정보
 */

class UserProfileModel extends Model {
    protected initialize() {
        this.name = 'userProfile';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            level:          { type: DataTypes.MEDIUMINT, allowNull: false, defaultValue: 1 },
            exp:            { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            following_cnt:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            followers_cnt:  { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            state_msg:      { type: DataTypes.STRING(100) },
            description:    { type: DataTypes.STRING(500) },
            url_banner:     { type: DataTypes.STRING(250) },
            // points:         { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
        };
    }


    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_id', targetKey: 'id' });
    }

}

export default (rdb: Sequelize) => new UserProfileModel(rdb);
