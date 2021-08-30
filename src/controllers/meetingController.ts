import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import axios from "axios"
import slackConfig from "../../config/slack";
import qs from "qs";
import {eBookingState} from "../commons/enums";
import slackController from "./slackController";
import {dbs} from "../commons/globals";
import {Transaction} from "sequelize";
import {forEach} from "lodash";


class meetingController {

    meetingList = async (user: any, trigger_id: any, clickedType?: string) => {

        const meetingList = await dbs.Booking.findAll({user_id: user.id})

        //@ts-ignore
        const list = meetingList.sort((a: any, b: any) => new Date(b.date) - new Date(a.date));

        const result = _.map(list, (meeting: any) => {
            if (!meeting.deleted_at) {
                return {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `\`${meeting.date}\` \` ${meeting.start}-${meeting.end}\` *${meeting.title}* \n`
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
                    }
                }

            } else {
                return null;
            }
        })

        return result.filter((element, i) => element !== null);
    }

    createMeetingForm(view: any, user: any) {
        const values = view.state.values;
        const blocks = view.blocks;



        const createMeeting = {
            user_id: user.id,
            room_number: values[blocks[0].block_id].room_number.selected_option.value,
            title: values[blocks[1].block_id].title.value,
            description: values[blocks[2].block_id].description.value,
            date: values[blocks[3].block_id].selected_date.selected_date,
            start: values[blocks[4].block_id].meeting_start.selected_option.value,
            end: values[blocks[4].block_id].meeting_end.selected_option.value,
        }

        const participantArr = values[blocks[5].block_id].participant_list.selected_users;

        return {createMeeting, participantArr}
    }

    createMeeting = async (view: any, user: any) => {
        return dbs.Booking.getTransaction(async (transaction: Transaction) => {

            const participantList: any = [];
            const participantArr = this.createMeetingForm(view, user).participantArr;

            const meetingForm = this.createMeetingForm(view, user).createMeeting


            const booking = await dbs.Booking.create(meetingForm, transaction);

            for (let i = 0; i < participantArr.length; i++) {

                let obj = {
                    user_id: participantArr[i],
                    booking_id: booking.id
                    // name:view.username
                }
                participantList.push(obj)
            }

            participantList.push(
                {
                    user_id: user.id,
                    booking_id: booking.id
                    // name:user.username
                }
            )
            // throw new Error()

            const result = await dbs.Participant.bulkCreate(participantList, transaction);

            await slackController.sendDm(participantArr, user, meetingForm);
        })


    }

    // sendResponse= async (booking_id: string, user: any, trigger_id: string) => {
    //     const result = axios.post()
    // }


    deleteMeeting = async (booking_id: string, user: any, trigger_id: string) => {
        const deleteMeeting = await dbs.Booking.destroy({id: booking_id})


        return deleteMeeting

    }

    getMeetingInfo = async (booking_id: string, user: any) => {

        const meeting = await dbs.Booking.findOne({id: booking_id});
        return meeting;

    }

    editBooking = async (view: any, booking_id: any, user: any) => {

        return dbs.Booking.getTransaction(async (transaction: Transaction) => {
            const values = view.state.values;
            const blocks = view.blocks;


            const bookingInfo = {
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


            const booking = await dbs.Booking.update(bookingInfo, {id: booking_id}, transaction);


            for (let i = 0; i < participantArr.length; i++) {

                let obj = {
                    user_id: participantArr[i],
                    booking_id: booking_id
                    // name:view.username
                }
                participantList.push(obj)
            }


            // throw new Error()
            console.log(participantList)
            await dbs.Participant.destroy({booking_id: booking_id});

            const result = await dbs.Participant.bulkCreate(participantList, transaction);

        })


    }
}


export default new meetingController;