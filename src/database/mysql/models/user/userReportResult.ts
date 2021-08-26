import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class UserReportResultModel extends Model {
    protected initialize(): void {
        this.name = 'userReportResult';
        this.attributes = {
            report_id:      { type: DataTypes.INTEGER, allowNull: false },
            admin_id:       { type: DataTypes.INTEGER, allowNull: false },
            content:        { type: DataTypes.STRING(500), allowNull: false },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.UserReport.model, { foreignKey: 'report_id', as: 'report' });
        this.model.belongsTo(dbs.Admin.model);
    }


}


export default (rdb: Sequelize) => new UserReportResultModel(rdb)
