import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class ParticipantModel extends Model {
    protected initialize(): void {
        this.name = 'participant'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            meeting_id: {type: DataTypes.INTEGER, allowNull: false}
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.Meeting.model, {foreignKey: 'meeting_id', targetKey: 'id'});
    }


    async findUser(user_id: any) {
        const result = await this.findOne({user_id: user_id})
        return result;
    }

    async findAllUser(meeting_id: string){
        const result = await this.findAll({meeting_id : meeting_id})
        return result;
    }


}


export default (rdb: Sequelize) => new ParticipantModel(rdb);
