import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class BookingModel extends Model {
    protected initialize(): void {
        this.name = 'booking'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            room_number: {type: DataTypes.INTEGER},
            title: {type: DataTypes.STRING},
            description: {type: DataTypes.STRING},
            date: {type: DataTypes.STRING},
            start: {type: DataTypes.INTEGER},
            end: {type: DataTypes.INTEGER},
        }
    }

    async afterSync(): Promise<void> {
        this.model.hasMany(dbs.Participant.model, {sourceKey: 'id', foreignKey: 'booking_id'});
    }

    async meetingInfo(meeting_id: string) {
        const result = await this.findOne({
            id: meeting_id
        })
        return result;
    }

    async hasBookingOnDate(date: any, roomNumber:number) {
        const result = await this.findAll({date: date, room_number:roomNumber});

        return result;
    }

    async hasBookingAtTime(time: string) {
        const result = await this.findAll({start: time});
        return result;
    }

}


export default (rdb: Sequelize) => new BookingModel(rdb);