import Model from '../../../_base/model';
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import * as moment from "moment-timezone";

class ParticipantModel extends Model {
    protected initialize(): void {
        this.name = 'participant'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            meeting_id: {type: DataTypes.INTEGER, allowNull: false},
            user_name:{type: DataTypes.STRING}
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.Meeting.model, {foreignKey: 'meeting_id', targetKey: 'id'});
    }


    async findUser(user_id: any, transaction?: Transaction) {
        const result = await this.findOne({user_id: user_id}, transaction)
        return result;
    }

    async findAllUser(meeting_id: number,transaction?: Transaction ){
        const result = await this.model.findAll({where: {meeting_id}}, transaction)
        return result;
    }



}


export default (rdb: Sequelize) => new ParticipantModel(rdb);
