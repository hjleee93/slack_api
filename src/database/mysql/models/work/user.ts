import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import slackApi from "../../../../services/slackApi";

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
            where: {user_id}
        }, transaction)
    }

    async createUser( user_id:any, transaction?:Transaction){
        const userData = await slackApi.getUserInfo(user_id);

        const user = {
            user_id,
            user_name: userData.data.user.real_name,
        };

        const hasUser = await this.findUser(user_id, transaction)

        if(!hasUser){
          await this.model.create(user, transaction)
        }

    }






}


export default (rdb: Sequelize) => new UserModel(rdb);
