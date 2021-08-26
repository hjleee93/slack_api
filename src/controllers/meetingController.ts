import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import axios from "axios"
import slackConfig from "../../config/slack";
import qs from "qs";
import {eBookingState} from "../commons/enums";
import slackController from "./slackController";
import {dbs} from "../commons/globals";

const Booking = dbs.Booking;
const Participant = dbs.participant;

class meetingController {

    meetingList = async (user: any, trigger_id: any, clickedType?:string) => {

        const meetingList = await Booking.findAll({
            where: {
                user_id: user.id,
                //     start: {
                //         [Op.gt]: moment().subtract(historyDuration, 'days').toDate()
                //     }
            },


        })

        // const userList = await Participant.findAll({
        //
        // })
        // for (let i = 0; i < bookingList.length; i++) {
        //     const args = {
        //         token: slackConfig.token,
        //         user: bookingList[i]
        //     };
        //
        // }

        // const result = await axios.get('https://slack.com/api/users.info', qs.stringify(args));


        const result = _.map(meetingList, (info: any) => {
            // for (let i = 0; i < bookingList.length; i++) {
            //     const args = {
            //         token: slackConfig.token,
            //         user: bookingList[i]
            //     };
            // }
            //
            // const bookingMemberList = await Participant.findAll({
            //     where: {
            //         booking_id: info.dataValues.id,
            //     }
            //
            // })
            // console.log(bookingMemberList)

            if (info.state == eBookingState.Booked) {


                return {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*${info.title}*\n${info.date} - ${info.start}-${info.end}\n${info.description}\n참여자: @iris, ~@zelda~`
                    },
                    "accessory": {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "emoji": true,
                            "text": `${clickedType === 'delete' ? '삭제' : '수정'}`
                        },
                        "value": `${info.id}`,
                        "action_id": `${clickedType === 'delete' ? 'meeting_delete' : 'meeting_edit'}`
                    },
                }

            } else if (info.state == eBookingState.Cancel) {
                return null;

            }
        })



        return result.filter(
            (element, i) => element !== null
        );
    }


    createBooking = async (view: any, user: any) => {
        const values = view.state.values;
        const blocks = view.blocks;


        const createBooking = {
            user_id: user.id,
            room_number: values[blocks[1].block_id].room_number.selected_option.value,
            title: values[blocks[2].block_id].title.value,
            description: values[blocks[3].block_id].description.value,
            date: values[blocks[4].block_id].date.selected_date,
            start: values[blocks[5].block_id].start.selected_option.value,
            end: values[blocks[5].block_id].end.selected_option.value,
            state: eBookingState.Booked,
        }

        const participantList: any = [];
        const participantArr = values[blocks[6].block_id].participant_list.selected_users;

        const booking = await Booking.create(createBooking);

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


        const result = await Participant.bulkCreate(participantList);

        await slackController.sendDm(participantArr, user, createBooking);





    }

    deleteMeeting = async (booking_id: string, user: any, trigger_id: string) => {
        const deleteMeeting = await Booking.update({state: eBookingState.Cancel},
            {where: {id: booking_id}})


        return deleteMeeting

    }

    getMeetingInfo= async (booking_id: string, user: any) => {

        const meeting = await Booking.findOne({id: booking_id});
        return meeting;

    }

    editBooking= async (booking_id: string, user: any) => {

    }
}


export default new meetingController;