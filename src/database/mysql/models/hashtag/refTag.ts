import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';


class RefTagModel extends Model {
    protected initialize(): void {
        this.name = 'refTag';
        this.attributes = {
            ref_id:     { type: DataTypes.INTEGER },
            ref_type:   { type: DataTypes.STRING },
            tag_id:     { type: DataTypes.INTEGER },
        }
    }

    async afterSync(): Promise<void> {
        await super.afterSync();

        this.model.belongsTo(dbs.Game.model, { foreignKey: 'ref_id', targetKey: 'id' });
    }
}


export default (rdb: Sequelize) => new RefTagModel(rdb)
