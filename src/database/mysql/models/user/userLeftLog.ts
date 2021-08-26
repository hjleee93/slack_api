import Model from '../../../_base/model';
import { dbs } from '../../../../commons/globals';
import { DataTypes, Sequelize } from 'sequelize';


enum EReasonLeft {
    just_because,
    no_zem,
    etc,
}
class UserLeftLog extends Model {
    protected initialize(): void {
        this.name = 'userLeftLog';
        this.attributes = {
            user_uid:       { type: DataTypes.STRING(36) },
            reason_num:     { type: DataTypes.SMALLINT, allowNull: false },
            reason_text:    { type: DataTypes.STRING(100) },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model, { foreignKey: 'user_uid', targetKey: 'uid' });
    }
}


export default (rdb: Sequelize) => new UserLeftLog(rdb)
