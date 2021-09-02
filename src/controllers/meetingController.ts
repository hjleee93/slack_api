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
            const membersObj = await dbs.Participant.findAllUser(meeting.id)

            const memberNameList = await Promise.all(_.map(membersObj, async (member: any) => {
                const memberInfo = await userController.getUserInfo(member.user_id)

                return memberInfo.data.user.real_name;
            }))



            if (!meeting.deleted_at) {
                return {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `📢*${meeting.title}* \n\n \`\`\`${moment(meeting.date, 'yyyy-MM-DD').format('yyyy-MM-DD')} ${moment(meeting.start, 'HH:mm:ss').format("HH:mm")} — ${moment(meeting.end, 'HH:mm:ss').format("HH:mm")}\`\`\` 참석자 : ${memberNameList}\n\n`
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
            room_number: data.roomNumber,
            title: data.title,
            description: data.description,
            date: data.date,
            start: data.start,
            end: data.end,
        }

        const participantArr = data.members;

        return {createMeeting, participantArr}
    }

    createMeeting = async (view: any, user: any) => {
        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {

            console.log(view)

            const participantList: any = [];
            const participantArr = this.createMeetingForm(view, user).participantArr;

            const meetingForm = this.createMeetingForm(view, user).createMeeting;

            const meeting = await dbs.Meeting.create(meetingForm, transaction);

            for (let i = 0; i < participantArr.length; i++) {

                let obj = {
                    user_id: participantArr[i],
                    meeting_id: meeting.id
                    // name:view.username
                }
                participantList.push(obj)
            }

            // // throw new Error()

            const result = await dbs.Participant.bulkCreate(participantList, transaction);

            await slackController.sendDm(participantArr, user, meetingForm);
        })


    }

    // sendResponse= async (booking_id: string, user: any, trigger_id: string) => {
    //     const result = axios.post()
    // }


    deleteMeeting = async (meeting_id: string, user: any, trigger_id: string) => {
        const deleteMeeting = await dbs.Meeting.destroy({id: meeting_id})


        return deleteMeeting

    }

    getMeetingInfo = async (meeting_id: string, user: any) => {

        const meeting = await dbs.Meeting.findOne({id: meeting_id});
        return meeting;

    }

    editMeeting = async (view: any, meeting_id: any, user: any) => {

        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {
            const values = view.state.values;
            const blocks = view.blocks;


            const meetingInfo = {
                room_number: values[blocks[1].block_id].room_number.selected_option.value,
                title: values[blocks[2].block_id].title.value,
                description: values[blocks[3].block_id].description.value,
                date: values[blocks[4].block_id].selected_date.selected_date,
                // start: values[blocks[5].block_id].start.selected_option.value,
                // end: values[blocks[5].block_id].end.selected_option.value,
                // state: eBookingState.Modified,
            }

            const participantList: any = [];
            const participantArr = values[blocks[6].block_id].participant_list.selected_users;


            const meeting = await dbs.Meeting.update(meetingInfo, {id: meeting_id}, transaction);


            for (let i = 0; i < participantArr.length; i++) {

                let obj = {
                    user_id: participantArr[i],
                    meeting_id: meeting_id
                    // name:view.username
                }
                participantList.push(obj)
            }


            // throw new Error()
            console.log(participantList)
            await dbs.Participant.destroy({meeting_id: meeting_id});

            const result = await dbs.Participant.bulkCreate(participantList, transaction);

        })


    }
}


export default new meetingController;