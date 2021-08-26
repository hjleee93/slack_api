import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class UserPunishedModel extends Model {
    protected initialize(): void {
        this.name = 'userPunished';
        this.attributes = {
            user_id:    { type: DataTypes.INTEGER, allowNull: false },
            is_denied:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            category:   { type: DataTypes.STRING(20), allowNull: false },
            reason:     { type: DataTypes.STRING(50), allowNull: false },
            end_at:     { type: DataTypes.DATE, allowNull: false },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model);
    }
}


export default (rdb: Sequelize) => new UserPunishedModel(rdb)
