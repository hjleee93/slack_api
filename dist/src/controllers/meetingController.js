"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const enums_1 = require("../commons/enums");
const slackController_1 = require("./slackController");
const globals_1 = require("../commons/globals");
class meetingController {
    constructor() {
        this.meetingList = (user, trigger_id, clickedType) => __awaiter(this, void 0, void 0, function* () {
            const meetingList = yield globals_1.dbs.Booking.findAll({ user_id: user.id });
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
            const result = _.map(meetingList, (meeting) => {
                let info = meeting.dataValues;
                if (!info.deleted_at) {
                    return {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*${info.title}*\n${info.date} - ${info.start}-${info.end}\n${info.description}\n`
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
                    };
                }
                else {
                    return null;
                }
            });
            return result.filter((element, i) => element !== null);
        });
        this.createBooking = (view, user) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.Booking.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const values = view.state.values;
                const blocks = view.blocks;
                const createBooking = {
                    user_id: user.id,
                    room_number: values[blocks[1].block_id].room_number.selected_option.value,
                    title: values[blocks[2].block_id].title.value,
                    description: values[blocks[3].block_id].description.value,
                    date: values[blocks[4].block_id].select_date.selected_date,
                    // start: values[blocks[5].block_id].meeting_start.selected_option.value,
                    // end: values[blocks[5].block_id].meeting_end.selected_option.value,
                    state: enums_1.eBookingState.Booked,
                };
                const participantList = [];
                const participantArr = values[blocks[6].block_id].participant_list.selected_users;
                const booking = yield globals_1.dbs.Booking.create(createBooking, transaction);
                for (let i = 0; i < participantArr.length; i++) {
                    let obj = {
                        user_id: participantArr[i],
                        booking_id: booking.id
                        // name:view.username
                    };
                    participantList.push(obj);
                }
                participantList.push({
                    user_id: user.id,
                    booking_id: booking.id
                    // name:user.username
                });
                // throw new Error()
                const result = yield globals_1.dbs.Participant.bulkCreate(participantList, transaction);
                yield slackController_1.default.sendDm(participantArr, user, createBooking);
            }));
        });
        // sendResponse= async (booking_id: string, user: any, trigger_id: string) => {
        //     const result = axios.post()
        // }
        this.deleteMeeting = (booking_id, user, trigger_id) => __awaiter(this, void 0, void 0, function* () {
            const deleteMeeting = yield globals_1.dbs.Booking.destroy({ id: booking_id });
            return deleteMeeting;
        });
        this.getMeetingInfo = (booking_id, user) => __awaiter(this, void 0, void 0, function* () {
            const meeting = yield globals_1.dbs.Booking.findOne({ id: booking_id });
            return meeting;
        });
        this.editBooking = (view, booking_id, user) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.Booking.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const values = view.state.values;
                const blocks = view.blocks;
                const bookingInfo = {
                    room_number: values[blocks[1].block_id].room_number.selected_option.value,
                    title: values[blocks[2].block_id].title.value,
                    description: values[blocks[3].block_id].description.value,
                    date: values[blocks[4].block_id].date.selected_date,
                    start: values[blocks[5].block_id].start.selected_option.value,
                    end: values[blocks[5].block_id].end.selected_option.value,
                    state: enums_1.eBookingState.Modified,
                };
                const participantList = [];
                const participantArr = values[blocks[6].block_id].participant_list.selected_users;
                const booking = yield globals_1.dbs.Booking.update(bookingInfo, { id: booking_id }, transaction);
                for (let i = 0; i < participantArr.length; i++) {
                    let obj = {
                        user_id: participantArr[i],
                        booking_id: booking_id
                        // name:view.username
                    };
                    participantList.push(obj);
                }
                // throw new Error()
                console.log(participantList);
                yield globals_1.dbs.Participant.destroy({ booking_id: booking_id });
                const result = yield globals_1.dbs.Participant.bulkCreate(participantList, transaction);
            }));
        });
    }
}
exports.default = new meetingController;
//# sourceMappingURL=meetingController.js.map