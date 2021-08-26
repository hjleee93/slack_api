import Model from '../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';

class SampleModel extends Model {
    protected initialize() {
        this.name = 'sample';
        this.attributes = {
            sample_attribute_1:     { type: DataTypes.INTEGER, allowNull: false },
            sample_attribute_2:     { type: DataTypes.STRING(20), allowNull: false },
        };
    }

}

export default (rdb: Sequelize) => new SampleModel(rdb);
