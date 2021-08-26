import Model from '../../../_base/model';
import { DataTypes, Sequelize } from 'sequelize';

class UserExternalLinkModel extends Model {
    protected initialize(): void {
        this.name = 'userExternalLink';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            name:           { type: DataTypes.STRING(30), allowNull: false },
            url_link:       { type: DataTypes.STRING(250), allowNull: false },
        }
    }
}


export default (rdb: Sequelize) => new UserExternalLinkModel(rdb)
