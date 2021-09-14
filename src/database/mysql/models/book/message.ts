import Model from '../../../_base/model';
import * as moment from "moment-timezone";
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';


class MessageModel extends Model {
    protected initialize(): void {
        this.name = 'message'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            message_id: {type: DataTypes.STRING, allowNull: false},
            channel_id: {type: DataTypes.STRING, allowNull: false},
            meeting_id: {type: DataTypes.STRING, allowNull: false},
        }
    }

    async createMsg(msgInfo:any, meeting_id: string, transaction?: Transaction){
       const info = {
            user_id : msgInfo.message.user,
            message_id :msgInfo.ts,
            channel_id : msgInfo.channel,
           meeting_id
        }
        await this.model.create(info, transaction)
    }

    async getMsgInfo(meeting_id: number){

      const result=  await this.model.findOne({where:{meeting_id}})
        return result

    }









}


export default (rdb: Sequelize) => new MessageModel(rdb);