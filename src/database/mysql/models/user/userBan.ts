import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class UserBanModel extends Model {
    protected initialize(): void {
        this.name = 'userBan';
        this.attributes = {
            user_id:    { type: DataTypes.INTEGER, allowNull: false },
            admin_id:   { type: DataTypes.INTEGER, allowNull: false },
            reason:     { type: DataTypes.STRING(300), allowNull: false },
            period:     { type: DataTypes.DATE },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.User.model);
        this.model.belongsTo(dbs.Admin.model);
    }
}


export default (rdb: Sequelize) => new UserBanModel(rdb)
