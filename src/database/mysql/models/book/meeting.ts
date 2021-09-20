import Model from '../../../_base/model';
import * as moment from "moment-timezone";
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import slackManager from "../../../../services/slackManager";
import * as _ from "lodash";
import blockManager from "../../../../services/blockManager";
import slackApi from "../../../../services/slackApi";
import {divide} from "lodash";

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
        this.model.hasMany(dbs.Msg.model, {sourceKey: 'id', foreignKey: 'meeting_id'});
    }

    async meetingInfo(meeting_id: string) {
        const result = await this.model.findOne({
            where: {
                id: meeting_id
            }
        })
        return result;
    }

    async hasMeetingOnDate(date: Date, room_number: string) {
        const result = await this.model.findAll({
            where: {
                date: new Date(moment(date).format('yyyy-MM-DD')),
                room_number: room_number
            }
        });
        return result;
    }

    async hasMeetingAtTime(date: Date, room_number: string, start: string, end: string, meeting_id?: number, transaction?: Transaction) {

        const result = await this.model.findOne({
            where: {
                start: {[Op.gte]: start, [Op.lt]: end},
                room_number,
                date,
                id: {
                    [Op.not]: meeting_id
                }
            },
            order: [['start']],
        }, transaction);
        return result;
    }

    async deleteMeeting(meeting_id: string, user: any, transaction?: Transaction) {

        const result = await this.model.destroy({where: {id: meeting_id, user_id: user.id}, transaction});
        return result;
    }


    async createMeeting(data: any, user: any, transaction?: Transaction) {

        if (!data.start || !data.end) {
            throw new Error('시간을 선택해주세요')
        }
        else {
            const meetingInfo = this.createMeetingForm({data: data, user: user});
            const members = meetingInfo.members;

            const hasMeeting = await this.hasMeetingAtTime(new Date(meetingInfo.date), meetingInfo.room_number, meetingInfo.start, meetingInfo.end, undefined, transaction);

            if (!hasMeeting) {

                const meeting = await this.model.create(meetingInfo, transaction);

                for (let i = 0; i < members.length; i++) {
                    const userInfo = await slackApi.getUserInfo(members[i]);
                    let obj = {
                        user_id: members[i],
                        meeting_id: meeting.id,
                        user_name: userInfo.data.user.real_name
                    }
                    members[i] = obj
                }
                await dbs.Participant.bulkCreate(members, transaction)
                return {meetingInfo, meetingId: meeting.id};

            }
            else {
                throw new Error('이미 등록된 예약이 있습니다.')
            }
        }

    }

    // meetingList = async (user: { id: string, username: string, name: string, team_id: string }) => {
    meetingList = async () => {
        const meetingList = await this.model.findAll({
            where: {
                date: {
                    [Op.gte]: new Date(moment().format('yyyy-MM-DD')),
                }
            },
            order: [['date'], ['start']],
            include: [{
                model: dbs.Participant.model,

            }]
        })
        return meetingList


    }


    editMeeting = async (data: any, meeting_id: number, user: any, transaction?: Transaction) => {

        const meetingInfo = this.createMeetingForm({data, user});

        const hasMeeting = await this.hasMeetingAtTime(new Date(meetingInfo.date), meetingInfo.room_number, meetingInfo.start, meetingInfo.end, meeting_id, transaction);

        if (!hasMeeting) {

            const members = data.members;

            for (let i = 0; i < members.length; i++) {
                const userInfo = await slackApi.getUserInfo(members[i].user_id || members[i]);
                let obj = {
                    user_id: members[i].user_id || members[i],
                    meeting_id,
                    user_name: userInfo.data.user.real_name
                }
                members[i] = obj
            }

            try {
                await this.model.update(meetingInfo, {where: {id: meeting_id}}, transaction);
                await dbs.Participant.destroy({meeting_id}, transaction);
                await dbs.Participant.bulkCreate(members, transaction);

                return meetingInfo;

            } catch (e: any) {
                throw new Error(e.message)
            }
        }
        else {
            throw new Error('이미 등록된 예약이 있습니다.')
        }


    }


    async allMsgUsers(meeting_id: number) {
        const result = await this.model.findOne({
            where: {id: meeting_id},
            include: [
                {
                    model: dbs.Msg.model,
                    attributes: ['user_id']
                },
                {
                    model: dbs.Participant.model,
                    attributes: ['user_id']
                },
            ]
        })

        return result;

    }

    createMeetingForm({data, user}: any) {
        const createMeeting = {
            user_id: user.id,
            room_number: data.room_number,
            title: data.title,
            description: data.description,
            date: data.date,
            start: data.start,
            end: data.end,
            members: data.members
        }

        return createMeeting
    }
}


export default (rdb: Sequelize) => new MeetingModel(rdb);