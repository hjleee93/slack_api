import Model from '../../../_base/model';
import * as moment from "moment-timezone";
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import slackManager from "../../../../services/slackManager";
import * as _ from "lodash";
import blockManager from "../../../../services/blockManager";

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
        const result = await this.model.findOne({
            where: {
                id: meeting_id
            }
        })
        return result;
    }

    async hasMeetingOnDate(date: Date, room_number: string) {
        const result = await this.model.findAll({where: {date: date, room_number: room_number}});
        return result;
    }

    async hasMeetingAtTime(date: Date, room_number: string, start: string, end: string) {

        const result = await this.model.findAll({
            where:
                {
                    start: {[Op.gte]: start, [Op.lt]: end},
                    room_number,
                    date: date
                }
        });
        return result;
    }

    async deleteMeeting(meeting_id: string) {
        const result = await this.model.destroy({where: {id: meeting_id}});
        return result;
    }

    createMeetingForm(data: any, user: any) {
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

    async createMeeting(data: any, user: any) {
        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {

            const participantList: any = [];
            const participantArr = this.createMeetingForm(data, user).members;

            const meetingForm = this.createMeetingForm(data, user);

            const hasMeeting = await dbs.Meeting.hasMeetingAtTime(new Date(meetingForm.date), meetingForm.room_number, meetingForm.start, meetingForm.end);

            if (hasMeeting && hasMeeting.length === 0) {

                const meeting = await dbs.Meeting.create(meetingForm, transaction);

                for (let i = 0; i < participantArr.length; i++) {

                    let obj = {
                        user_id: participantArr[i],
                        meeting_id: meeting.id
                        // name:view.username
                    }
                    participantList.push(obj)
                }

                await dbs.Participant.bulkCreate(participantList, transaction);

                await slackManager.sendDm(participantArr, user, meetingForm);

            } else {
                throw new Error('이미 등록된 예약이 있습니다.')
            }
        })

    }

    meetingList = async (user: any, trigger_id: any, clickedType?: string) => {

        const meetingList = await this.model.findAll({
            where: {
                date: {
                    [Op.gte]: moment().toDate(),
                }
            }
        })

        console.log(meetingList)

        //@ts-ignore
        const list = meetingList.sort((a: any, b: any) => new Date(b.date) - new Date(a.date));

        // const member = await dbs.Participants.findUser()
        const result = await Promise.all(_.map(list, async (meeting: any) => {
            const membersObj = await dbs.Participant.findAllUser(meeting.id)

            const memberNameList = await Promise.all(_.map(membersObj, async (member: any) => {
                const memberInfo = await slackManager.getUserInfo(member.user_id)

                return memberInfo.data.user.real_name;
            }))


            if (!meeting.deleted_at) {
                return blockManager.meeting.list(meeting, memberNameList);
            } else {
                return null;
            }
        }));


        return result.filter((element, i) => element !== null);
    }


    editMeeting = async (data: any, meeting_id: number, user: any) => {

        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {

            const meetingForm = this.createMeetingForm(data, user);

            const hasMeeting = await dbs.Meeting.hasMeetingAtTime(new Date(meetingForm.date), meetingForm.room_number, meetingForm.start, meetingForm.end);


            _.forEach(hasMeeting, (meeting: any, idx: number) => {
                if (meeting.id == meeting_id) {
                    hasMeeting.splice(idx, 1)
                }
            })

            if (hasMeeting && hasMeeting.length === 0) {

                const participantList: any = [];
                const participantArr = data.members;


                await dbs.Meeting.update(meetingForm, {id: meeting_id}, transaction);

                for (let i = 0; i < participantArr.length; i++) {

                    let obj = {
                        user_id: participantArr[i],
                        meeting_id: meeting_id
                        // name:view.username
                    }
                    participantList.push(obj)
                }

                await dbs.Participant.destroy({meeting_id: meeting_id});

                await dbs.Participant.bulkCreate(participantList, transaction);
            } else {

                throw new Error('이미 등록된 예약이 있습니다.')
            }
        })


    }
}


export default (rdb: Sequelize) => new MeetingModel(rdb);