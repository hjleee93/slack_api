import Model from '../../../_base/model';
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import * as moment from "moment-timezone";
import * as _ from "lodash";

class ParticipantModel extends Model {
    protected initialize(): void {
        this.name = 'participant'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            meeting_id: {type: DataTypes.INTEGER, allowNull: false},
            user_name: {type: DataTypes.STRING}
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.Meeting.model, {foreignKey: 'meeting_id', targetKey: 'id'});
    }


    async findUser(user_id: any, transaction?: Transaction) {
        const result = await this.findOne({user_id: user_id}, transaction)
        return result;
    }

    async findAllUser(meeting_id: number, transaction?: Transaction) {
        const result = await this.model.findAll({where: {meeting_id}}, transaction)
        return result;
    }

    async userMeetingList(user_id: string) {

        const participantList = await this.model.findAll({
            where: {},
            include: [{
                model: dbs.Meeting.model,
                where: {
                    date: {
                        [Op.gte]: new Date(moment().format('yyyy-MM-DD')),
                    },
                },
                order: [['date'], ['start']],
                required: true,
                include: [{
                    model: this.model,
                    where: {
                        user_id,
                    },
                    required: true,
                }]
            }]
        });

        for (let i = participantList.length - 1; i >= 0; i -= 1) {
            if (participantList[i].user_id !== participantList[i].meeting.participants[0].user_id) {
                participantList[i].meeting.participants.push(participantList[i])
            } else {
                participantList.splice(i, 1);
            }
        }

        return _.map(participantList, (p: any) => {

            const {meeting} = p;
            return meeting
        })


    }

}


export default (rdb: Sequelize) => new ParticipantModel(rdb);
