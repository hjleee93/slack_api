import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class MeetingModel extends Model {
    protected initialize(): void {
        this.name = 'meeting'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            room_number: {type: DataTypes.INTEGER},
            title: {type: DataTypes.STRING},
            description: {type: DataTypes.STRING},
            date: {type: DataTypes.DATE},
            start: {type: DataTypes.TIME},
            end: {type: DataTypes.TIME},
        }
    }

    async afterSync(): Promise<void> {
        this.model.hasMany(dbs.Participant.model, {sourceKey: 'id', foreignKey: 'meeting_id'});
    }

    async meetingInfo(meeting_id: string) {
        const result = await this.findOne({
            id: meeting_id
        })
        return result;
    }

    async hasMeetingOnDate(date: Date, roomNumber:string) {
        const result = await this.findAll({date: date, room_number:roomNumber});
        return result;
    }

    async hasMeetingAtTime(time: string) {
        const result = await this.findAll({start: time});
        return result;
    }

}


export default (rdb: Sequelize) => new MeetingModel(rdb);