import Model from '../../../_base/model';
import * as moment from "moment-timezone";
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import {dbs} from "../../../../commons/globals";


class MsgModel extends Model {
    protected initialize(): void {
        this.name = 'msg'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            message_id: {type: DataTypes.STRING, allowNull: false},
            channel_id: {type: DataTypes.STRING, allowNull: false},
            meeting_id: {type: DataTypes.INTEGER, allowNull: false},
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.Meeting.model, {foreignKey: 'meeting_id', targetKey: 'id'});
        this.model.hasOne(dbs.Participant.model, {foreignKey: 'meeting_id', targetKey: 'id'});
    }


    async createMsg(msgInfo: any[], meeting_id: number,meetingInfo:any, transaction?: Transaction) {

        const info: any[] = [];

        for (let i = 0; i < msgInfo.length; i++) {
            let obj = {
                user_id: meetingInfo.members[i].user_id,
                message_id: msgInfo[i].data.ts,
                channel_id: msgInfo[i].data.channel,
                meeting_id,
            }
            info[i] = obj;

        }
        await this.model.bulkCreate(info, transaction)
    }

    async getMsgInfo(meeting_id: number) {

        const result = await this.model.findAll({where: {meeting_id}})
        return result

    }



}


export default (rdb: Sequelize) => new MsgModel(rdb);