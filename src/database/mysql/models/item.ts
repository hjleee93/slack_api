import Model from '../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';
import { eItemUsingType } from '../../../commons/enums';


class ItemModel extends Model {
    protected initialize(): void {
        this.name = 'item';
        this.attributes = {
            name:           { type: DataTypes.STRING(20), allowNull: false },
            used_type:      { type: DataTypes.SMALLINT, allowNull: false, defaultValue: eItemUsingType.Permanent },
            // is_using:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            period:         { type: DataTypes.INTEGER },
            is_used:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }
    }
}


export default (rdb: Sequelize) => new ItemModel(rdb)
