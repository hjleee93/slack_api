import Model from '../../../_base/model';
import {DataTypes, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';

class BookingModel extends Model {
    protected initialize(): void {
        this.name = 'booking'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            room_number: {type: DataTypes.STRING},
            title: {type: DataTypes.STRING},
            description: {type: DataTypes.STRING},
            date: {type: DataTypes.STRING},
            start: {type: DataTypes.STRING},
            end: {type: DataTypes.STRING},
        }
    }

    async afterSync(): Promise<void> {
        this.model.hasMany(dbs.Participant.model, {sourceKey: 'id', foreignKey: 'booking_id'});
    }

    async hasBookingOnDate(date: string){
        const result = await this.findAll({date:date});
        // await this.hasBookingAtTime(result.start)

        return result.dataValues;
    }

    async hasBookingAtTime(time: string){
        const result = await this.findAll({start:time});
        return result;
    }

}


export default (rdb: Sequelize) => new BookingModel(rdb);