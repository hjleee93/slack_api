import { DataTypes, Sequelize } from 'sequelize';
import Model from '../../../_base/model';


class FaqModel extends Model {
    protected initialize(): void {
        this.name = 'faq';
        this.attributes = {
            category:   { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 0 },
            q:          { type: DataTypes.STRING(100), allowNull: false },
            a:          { type: DataTypes.STRING(500), allowNull: false },
            url_img:    { type: DataTypes.STRING },
        }
    }


}


export default (rdb: Sequelize) => new FaqModel(rdb)
