import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { eReportType } from '../../../../commons/enums';
import { dbs } from '../../../../commons/globals';


/**
 * 신고 하기
 * user_id: 신고한 유저
 * target_id: 신고 당한 유저/게임/댓글/...
 */

class UserReportModel extends Model {
    protected initialize(): void {
        this.name = 'userReport';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            target_type:    { type: DataTypes.SMALLINT, allowNull: false, defaultValue: eReportType.Game },
            target_id:      { type: DataTypes.INTEGER, allowNull: false },
            reason_num:     { type: DataTypes.STRING(30), allowNull: false },
            reason:         { type: DataTypes.STRING(300) },
            is_done:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            url_img:        { type: DataTypes.STRING(255) },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model, { foreignKey: 'target_id', targetKey: 'id' });
        this.model.belongsTo(dbs.Game.model, { foreignKey: 'target_id', targetKey: 'id' });
    }
}


export default (rdb: Sequelize) => new UserReportModel(rdb)
