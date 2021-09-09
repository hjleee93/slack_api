import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import axios from "axios"
import slackConfig from "../../config/slack";
import qs from "qs";
import slackController from "./slackController";
import userController from "./userController";
import {dbs} from "../commons/globals";
import {Transaction} from "sequelize";
import blockManager from "../sevices/blockManager";


class meetingController {

    meetingList = async (user: any, trigger_id: any, clickedType?: string) => {

        const meetingList = await dbs.Meeting.findAll()

        //@ts-ignore
        const list = meetingList.sort((a: any, b: any) => new Date(b.date) - new Date(a.date));

        // const member = await dbs.Participants.findUser()
        const result = await Promise.all(_.map(list, async (meeting: any) => {
            const membersObj =  await dbs.Participant.findAllUser(meeting.id)

            const memberNameList = await Promise.all(_.map(membersObj, async (member: any) => {
                const memberInfo = await userController.getUserInfo(member.user_id)

                return memberInfo.data.user.real_name;
            }))


            if (!meeting.deleted_at) {
                return {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `📢*${meeting.title}* \n\n 참석자 : ${_.map(memberNameList, (name:any)=>{return ' ' + name })}\n\n \`\`\`${moment(meeting.date, 'yyyy-MM-DD').format('yyyy-MM-DD')} ${moment(meeting.start, 'HH:mm:ss').format("HH:mm")} — ${moment(meeting.end, 'HH:mm:ss').format("HH:mm")}\`\`\` `
                    },

                    "accessory": {
                        // },
                        "type": "overflow",
                        "action_id": "select_meeting_option",
                        "options": [
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "Edit",
                                    "emoji": true
                                },
                                "value": `${meeting.id}`

                            },
                            {
                                "text": {
                                    "type": "plain_text",
                                    "text": "Delete",
                                    "emoji": true
                                },
                                "value": `${meeting.id}`

                            }
                        ]
                    },

                }


            } else {
                return null;
            }
        }));

        return result.filter((element, i) => element !== null);
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

    createMeeting = async (data: any, user: any) => {
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

                await slackController.sendDm(participantArr, user, meetingForm);

            } else {
                throw new Error('이미 등록된 예약이 있습니다.')
            }
        })


    }


    deleteMeeting = async (meeting_id: string, user: any, trigger_id: string) => {
        const deleteMeeting = await dbs.Meeting.destroy({id: meeting_id})

        return deleteMeeting

    }

    getMeetingInfo = async (meeting_id: string, user: any) => {

        const meeting = await dbs.Meeting.findOne({id: meeting_id});
        return meeting;

    }

    editMeeting = async (data: any, meeting_id: number, user: any) => {

        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {

            const meetingForm = this.createMeetingForm(data, user);

            const hasMeeting = await dbs.Meeting.hasMeetingAtTime(new Date(meetingForm.date), meetingForm.room_number, meetingForm.start, meetingForm.end);


            _.forEach(hasMeeting, (meeting:any, idx:number)=>{
              if(meeting.id == meeting_id){
                   hasMeeting.splice(idx,1)
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

                // throw new Error()
                await dbs.Participant.destroy({meeting_id: meeting_id});

                await dbs.Participant.bulkCreate(participantList, transaction);
            }else {

                throw new Error('이미 등록된 예약이 있습니다.')
            }
        })



    }
}


export default new meetingController;