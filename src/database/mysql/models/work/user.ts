import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class UserModel extends Model {
    protected initialize(): void {
        this.name = 'user'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            user_name: DataTypes.STRING,
        }
    }

    async afterSync(): Promise<void> {
        this.model.hasMany(dbs.WorkLog.model, {sourceKey: 'user_id', foreignKey: 'user_id'});
    }

    async findUser(user_id: string, transaction?:Transaction){
        return await this.model.findOne({
            where:user_id
        })
    }






}


export default (rdb: Sequelize) => new UserModel(rdb);
