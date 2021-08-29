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
const axios_1 = require("axios");
const moment = require("moment-timezone");
const slack_1 = require("../../config/slack");
const workTimeController_1 = require("./workTimeController");
const meetingController_1 = require("./meetingController");
const viewController_1 = require("./viewController");
const workTimeController_2 = require("./workTimeController");
const globals_1 = require("../commons/globals");
const home_view = require("../json/home.json");
const booking_done_modal = require("../json/booking_done_modal.json");
const booking_edit_done_modal = require("../json/booking_edit_done_modal.json");
const qs = require('qs');
class slackController {
    constructor() {
        this.bookingId = 0;
        this.startTime = viewController_1.default.setStartTime();
        this.endTime = viewController_1.default.setEndTime();
        this.meetingStartTime = 0;
        this.event = (req, res) => __awaiter(this, void 0, void 0, function* () {
            res.send(req.body);
            const { type, user, channel, tab, text, subtype } = req.body.event;
            if (type === 'app_home_opened') {
                let homeBlock = home_view;
                yield this.displayHome(user, homeBlock);
            }
        });
        this.actions = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { token, trigger_id, user, actions, type, container } = JSON.parse(req.body.payload);
            //modal submission
            if (type === 'view_submission') {
                const payload = JSON.parse(req.body.payload);
                const submitType = payload.view.submit.text;
                if (submitType === 'Edit') {
                    yield meetingController_1.default.editBooking(payload.view, this.bookingId, user);
                    res.send(booking_edit_done_modal);
                }
                else {
                    yield meetingController_1.default.createBooking(payload.view, user);
                    console.log(booking_done_modal);
                    res.send(booking_done_modal);
                }
            }
            if (actions && actions[0].action_id.match(/work_start/)) {
                try {
                    yield workTimeController_1.default.workStart(user, trigger_id);
                    res.sendStatus(200);
                }
                catch (e) {
                    res.sendStatus(500);
                }
            }
            else if (actions && actions[0].action_id.match(/work_end/)) {
                yield workTimeController_1.default.workEnd(user, trigger_id);
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/work_history/)) {
                const historyDuration = actions[0].value;
                const result = yield workTimeController_1.default.workHistory(user, historyDuration, trigger_id);
                const history_block = [
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "출근"
                                },
                                "style": "primary",
                                "value": "click_me_123",
                                "action_id": "work_start"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "퇴근"
                                },
                                "style": "danger",
                                "value": "click_me_123",
                                "action_id": "work_end"
                            },
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "출퇴근 통계를 확인하고 싶은 날짜를 고르세요",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "7일",
                                    "emoji": true
                                },
                                "value": "7",
                                "action_id": "work_history1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "15일",
                                    "emoji": true
                                },
                                "value": "15",
                                "action_id": "work_history2"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "30일",
                                    "emoji": true
                                },
                                "value": "30",
                                "action_id": "work_history3"
                            },
                        ]
                    },
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": `${moment().subtract(historyDuration, 'days').format('yyyy-MM-DD')} ~ ${moment().format('yyyy-MM-DD')} 출퇴근 기록`,
                            "emoji": true
                        }
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*--------------------------------------------------------------------*\n          *날짜         |          출근 시간          |          퇴근 시간          *\n*--------------------------------------------------------------------*"
                        }
                    },
                    ...result,
                    {
                        "type": "divider"
                    },
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "예약",
                                    "emoji": true
                                },
                                "style": "primary",
                                "value": "booking",
                                "action_id": "meeting_booking"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "취소",
                                    "emoji": true
                                },
                                "style": "danger",
                                "value": "cancel",
                                "action_id": "meeting_cancel"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "수정",
                                    "emoji": true
                                },
                                "value": "edit",
                                "action_id": "meeting_list1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "확인",
                                    "emoji": true
                                },
                                "value": "delete",
                                "action_id": "meeting_list2"
                            }
                        ]
                    },
                ];
                yield this.displayHome(user.id, history_block);
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/meeting_booking/)) {
                yield this.openModal(trigger_id);
                // this.bookingId
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/meeting_cancel/)) {
                const cancel_block = [
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "출근"
                                },
                                "style": "primary",
                                "value": "click_me_123",
                                "action_id": "work_start"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "퇴근"
                                },
                                "style": "danger",
                                "value": "click_me_123",
                                "action_id": "work_end"
                            },
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "출퇴근 통계를 확인하고 싶은 날짜를 고르세요",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "7일",
                                    "emoji": true
                                },
                                "value": "7",
                                "action_id": "work_history1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "15일",
                                    "emoji": true
                                },
                                "value": "15",
                                "action_id": "work_history2"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "30일",
                                    "emoji": true
                                },
                                "value": "30",
                                "action_id": "work_history3"
                            },
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "예약",
                                    "emoji": true
                                },
                                "style": "primary",
                                "value": "booking",
                                "action_id": "meeting_booking"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "취소",
                                    "emoji": true
                                },
                                "style": "danger",
                                "value": "cancel",
                                "action_id": "meeting_cancel"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "수정",
                                    "emoji": true
                                },
                                "value": "edit",
                                "action_id": "meeting_list1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "확인",
                                    "emoji": true
                                },
                                "value": "delete",
                                "action_id": "meeting_list2"
                            }
                        ]
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "datepicker",
                            "initial_date": moment().format('yyyy-MM-DD'),
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a date",
                                "emoji": true
                            },
                            "action_id": "meeting_list"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "미팅 취소할 날짜",
                            "emoji": true
                        },
                    },
                ];
                yield this.displayHome(user.id, cancel_block);
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/meeting_list/)) {
                const clickedType = actions[0].value;
                const result = yield meetingController_1.default.meetingList(user, trigger_id, clickedType);
                // const result = await workController.meetingList(user, trigger_id)
                // console.log(actions[0])
                const list_block = [
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "출근"
                                },
                                "style": "primary",
                                "value": "click_me_123",
                                "action_id": "work_start"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "퇴근"
                                },
                                "style": "danger",
                                "value": "click_me_123",
                                "action_id": "work_end"
                            },
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "출퇴근 통계를 확인하고 싶은 날짜를 고르세요",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "7일",
                                    "emoji": true
                                },
                                "value": "7",
                                "action_id": "work_history1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "15일",
                                    "emoji": true
                                },
                                "value": "15",
                                "action_id": "work_history2"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "30일",
                                    "emoji": true
                                },
                                "value": "30",
                                "action_id": "work_history3"
                            },
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "예약",
                                    "emoji": true
                                },
                                "style": "primary",
                                "value": "booking",
                                "action_id": "meeting_booking"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "취소",
                                    "emoji": true
                                },
                                "style": "danger",
                                "value": "cancel",
                                "action_id": "meeting_cancel"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "수정",
                                    "emoji": true
                                },
                                "value": "edit",
                                "action_id": "meeting_list1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "확인",
                                    "emoji": true
                                },
                                "value": "delete",
                                "action_id": "meeting_list2"
                            }
                        ]
                    },
                    ...result
                ];
                yield this.displayHome(user.id, list_block);
            }
            else if (actions && actions[0].action_id.match(/meeting_delete/)) {
                const booking_id = actions[0].value;
                const result = yield meetingController_1.default.deleteMeeting(booking_id, user, trigger_id);
                if (result === 1) {
                    yield workTimeController_2.default.openModal(trigger_id, '해당 예약은 삭제되었습니다.');
                }
                const result1 = yield meetingController_1.default.meetingList(user, trigger_id);
                // const result = await workController.meetingList(user, trigger_id)
                // console.log(actions[0])
                const list_block = [
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "출근"
                                },
                                "style": "primary",
                                "value": "click_me_123",
                                "action_id": "work_start"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "emoji": true,
                                    "text": "퇴근"
                                },
                                "style": "danger",
                                "value": "click_me_123",
                                "action_id": "work_end"
                            },
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "출퇴근 통계를 확인하고 싶은 날짜를 고르세요",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "7일",
                                    "emoji": true
                                },
                                "value": "7",
                                "action_id": "work_history1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "15일",
                                    "emoji": true
                                },
                                "value": "15",
                                "action_id": "work_history2"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "30일",
                                    "emoji": true
                                },
                                "value": "30",
                                "action_id": "work_history3"
                            },
                        ]
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "예약",
                                    "emoji": true
                                },
                                "style": "primary",
                                "value": "booking",
                                "action_id": "meeting_booking"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "취소",
                                    "emoji": true
                                },
                                "style": "danger",
                                "value": "cancel",
                                "action_id": "meeting_cancel"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "수정",
                                    "emoji": true
                                },
                                "value": "edit",
                                "action_id": "meeting_list1"
                            },
                            {
                                "type": "button",
                                "text": {
                                    "type": "plain_text",
                                    "text": "확인",
                                    "emoji": true
                                },
                                "value": "delete",
                                "action_id": "meeting_list2"
                            }
                        ]
                    },
                    ...result1
                ];
                yield this.displayHome(user.id, list_block);
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/meeting_edit/)) {
                const booking_id = actions[0].value;
                const bookingInfo = yield meetingController_1.default.getMeetingInfo(booking_id, user);
                yield this.openEditModal(trigger_id, bookingInfo.dataValues);
            }
            else if (actions && actions[0].action_id.match(/select_date/)) {
                const timeList = [];
                const selected_date = actions[0].selected_date;
                const meetings = yield globals_1.dbs.Booking.hasBookingOnDate(selected_date);
                _.forEach(meetings, (meeting) => {
                    timeList.push(meeting.start);
                    timeList.push(meeting.end);
                });
                this.startTime = viewController_1.default.setStartTime(timeList);
                const modal = {
                    type: 'modal',
                    "title": {
                        "type": "plain_text",
                        "text": "My App",
                        "emoji": true
                    },
                    "submit": {
                        "type": "plain_text",
                        "text": "Submit",
                        "emoji": true
                    },
                    "close": {
                        "type": "plain_text",
                        "text": "Cancel",
                        "emoji": true
                    },
                    blocks: [
                        // Text input
                        {
                            "type": "section",
                            "block_id": "booking-identifier",
                            "text": {
                                "type": "plain_text",
                                "text": "선택부탁",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "Select an item",
                                    "emoji": true
                                },
                                "options": [
                                    {
                                        "text": {
                                            "type": "plain_text",
                                            "text": "302",
                                            "emoji": true
                                        },
                                        "value": "302"
                                    },
                                    {
                                        "text": {
                                            "type": "plain_text",
                                            "text": "402",
                                            "emoji": true
                                        },
                                        "value": "402"
                                    },
                                ],
                                "action_id": "room_number"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "회의실",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "action_id": "title"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "안건",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "multiline": true,
                                "action_id": "description",
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "자세히",
                                "emoji": true
                            },
                            "optional": true
                        },
                        {
                            "type": "input",
                            dispatch_action: true,
                            "element": {
                                "type": "datepicker",
                                "initial_date": moment().format('yyyy-MM-DD'),
                                "action_id": "select_date"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "미팅 할 날짜",
                                "emoji": true
                            }
                        },
                        {
                            "type": "actions",
                            dispatch_action: true,
                            "elements": [
                                {
                                    "type": "static_select",
                                    "placeholder": {
                                        "type": "plain_text",
                                        "text": "회의 시작 시각",
                                        "emoji": true
                                    },
                                    "options": [
                                        ...this.startTime
                                    ],
                                    "action_id": "meeting_start"
                                },
                                //회의 끝
                                {
                                    "type": "static_select",
                                    "placeholder": {
                                        "type": "plain_text",
                                        "text": "회의 종료 시각",
                                        "emoji": true
                                    },
                                    "options": [
                                        ...this.endTime
                                    ],
                                    "action_id": "meeting_end"
                                }
                            ]
                        },
                        //참석자
                        {
                            "type": "input",
                            "element": {
                                "type": "multi_users_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "Select users",
                                    "emoji": true
                                },
                                "action_id": "participant_list"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "미팅 참여자",
                                "emoji": true
                            }
                        },
                    ]
                };
                const args = {
                    token: slack_1.default.token,
                    view: JSON.stringify(modal),
                    view_id: container.view_id
                };
                const result = yield axios_1.default.post('https://slack.com/api/views.update', qs.stringify(args));
                res.sendStatus(200);
            }
            else if (actions && actions[0].action_id.match(/meeting_start/)) {
                const endTimeList = viewController_1.default.setEndTime(actions[0].selected_option.value);
                const modal = {
                    type: 'modal',
                    "title": {
                        "type": "plain_text",
                        "text": "My App",
                        "emoji": true
                    },
                    "submit": {
                        "type": "plain_text",
                        "text": "Submit",
                        "emoji": true
                    },
                    "close": {
                        "type": "plain_text",
                        "text": "Cancel",
                        "emoji": true
                    },
                    blocks: [
                        // Text input
                        {
                            "type": "section",
                            "block_id": "booking-identifier",
                            "text": {
                                "type": "plain_text",
                                "text": "선택부탁",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "Select an item",
                                    "emoji": true
                                },
                                "options": [
                                    {
                                        "text": {
                                            "type": "plain_text",
                                            "text": "302",
                                            "emoji": true
                                        },
                                        "value": "302"
                                    },
                                    {
                                        "text": {
                                            "type": "plain_text",
                                            "text": "402",
                                            "emoji": true
                                        },
                                        "value": "402"
                                    },
                                ],
                                "action_id": "room_number"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "회의실",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "action_id": "title"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "안건",
                                "emoji": true
                            }
                        },
                        {
                            "type": "input",
                            "element": {
                                "type": "plain_text_input",
                                "multiline": true,
                                "action_id": "description",
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "자세히",
                                "emoji": true
                            },
                            "optional": true
                        },
                        {
                            "type": "input",
                            dispatch_action: true,
                            "element": {
                                "type": "datepicker",
                                "initial_date": moment().format('yyyy-MM-DD'),
                                "action_id": "select_date"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "미팅 할 날짜",
                                "emoji": true
                            }
                        },
                        {
                            "type": "actions",
                            // dispatch_action: true,
                            "elements": [
                                {
                                    "type": "static_select",
                                    "placeholder": {
                                        "type": "plain_text",
                                        "text": "회의 시작 시각",
                                        "emoji": true
                                    },
                                    "options": [
                                        ...this.startTime
                                    ],
                                    "action_id": "meeting_start"
                                },
                                //회의 끝
                                {
                                    "type": "static_select",
                                    "placeholder": {
                                        "type": "plain_text",
                                        "text": "회의 종료 시각",
                                        "emoji": true
                                    },
                                    "options": [
                                        ...endTimeList
                                    ],
                                    "action_id": "meeting_end"
                                }
                            ]
                        },
                        //참석자
                        {
                            "type": "input",
                            "element": {
                                "type": "multi_users_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "Select users",
                                    "emoji": true
                                },
                                "action_id": "participant_list"
                            },
                            "label": {
                                "type": "plain_text",
                                "text": "미팅 참여자",
                                "emoji": true
                            }
                        },
                    ]
                };
                const args = {
                    token: slack_1.default.token,
                    view: JSON.stringify(modal),
                    view_id: container.view_id
                };
                const result = yield axios_1.default.post('https://slack.com/api/views.update', qs.stringify(args));
            }
            else if (actions && actions[0].action_id.match(/meeting_end/)) {
            }
        });
        this.displayHome = (user, block, data) => __awaiter(this, void 0, void 0, function* () {
            const args = {
                token: slack_1.default.token,
                user_id: user,
                view: yield this.updateView(user, block)
            };
            // console.log(args)
            const result = yield axios_1.default.post('https://slack.com/api/views.publish', qs.stringify(args));
            // console.log(result)
        });
        this.updateView = (user, blocks) => __awaiter(this, void 0, void 0, function* () {
            let view = {
                type: 'home',
                title: {
                    type: 'plain_text',
                    text: 'Keep notes!'
                },
                blocks: blocks
            };
            return JSON.stringify(view);
        });
        this.openModal = (trigger_id) => __awaiter(this, void 0, void 0, function* () {
            const modal = {
                type: 'modal',
                "title": {
                    "type": "plain_text",
                    "text": "My App",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Submit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                blocks: [
                    // Text input
                    {
                        "type": "section",
                        "block_id": "booking-identifier",
                        "text": {
                            "type": "plain_text",
                            "text": "선택부탁",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select an item",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "302",
                                        "emoji": true
                                    },
                                    "value": "302"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "402",
                                        "emoji": true
                                    },
                                    "value": "402"
                                },
                            ],
                            "action_id": "room_number"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "title"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "안건",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "action_id": "description",
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "자세히",
                            "emoji": true
                        },
                        "optional": true
                    },
                    {
                        "type": "input",
                        dispatch_action: true,
                        "element": {
                            "type": "datepicker",
                            "initial_date": moment().format('yyyy-MM-DD'),
                            "action_id": "select_date"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "미팅 할 날짜",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "회의 시작 시각",
                                    "emoji": true
                                },
                                "options": [
                                    ...this.startTime
                                ],
                                "action_id": "meeting_start"
                            },
                            //회의 끝
                            {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "회의 종료 시각",
                                    "emoji": true
                                },
                                "options": [
                                    ...this.endTime
                                ],
                                "action_id": "meeting_end"
                            }
                        ]
                    },
                    //참석자
                    {
                        "type": "input",
                        "element": {
                            "type": "multi_users_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select users",
                                "emoji": true
                            },
                            "action_id": "participant_list"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "미팅 참여자",
                            "emoji": true
                        }
                    },
                ]
            };
            const args = {
                token: slack_1.default.token,
                trigger_id: trigger_id,
                view: JSON.stringify(modal)
            };
            const result = yield axios_1.default.post('https://slack.com/api/views.open', qs.stringify(args));
        });
        this.openEditModal = (trigger_id, bookingInfo) => __awaiter(this, void 0, void 0, function* () {
            //initial_users
            const userIdList = yield this.getUserId(bookingInfo.id);
            this.bookingId = bookingInfo.id;
            const editModal = {
                type: 'modal',
                "title": {
                    "type": "plain_text",
                    "text": "My App",
                    "emoji": true
                },
                "submit": {
                    "type": "plain_text",
                    "text": "Edit",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "Cancel",
                    "emoji": true
                },
                blocks: [
                    // Text input
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": "선택부탁",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select an item",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "302",
                                        "emoji": true
                                    },
                                    "value": "302"
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "402",
                                        "emoji": true
                                    },
                                    "value": "402"
                                },
                                // {
                                //     "text": {
                                //         "type": "plain_text",
                                //         "text": "*this is plain_text text*",
                                //         "emoji": true
                                //     },
                                //     "value": "value-2"
                                // }
                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": bookingInfo.room_number,
                                    "emoji": true
                                },
                                "value": bookingInfo.room_number
                            },
                            "action_id": "room_number"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "회의실",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "action_id": "title",
                            "initial_value": bookingInfo.title
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "안건",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "plain_text_input",
                            "multiline": true,
                            "action_id": "description",
                            "initial_value": bookingInfo.description
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "자세히",
                            "emoji": true
                        }
                    },
                    {
                        "type": "input",
                        "element": {
                            "type": "datepicker",
                            // 1990-04-28"
                            "initial_date": bookingInfo.date,
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select a date",
                                "emoji": true
                            },
                            "action_id": "date"
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "미팅 할 날짜",
                            "emoji": true
                        }
                    },
                    {
                        "type": "actions",
                        "elements": [
                            {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "회의 시작 시각",
                                    "emoji": true
                                },
                                "options": [
                                    ...this.startTime
                                ],
                                "initial_option": {
                                    "text": {
                                        "type": "plain_text",
                                        "text": bookingInfo.start,
                                        "emoji": true
                                    },
                                    "value": bookingInfo.start
                                },
                                "action_id": "meeting_start"
                            },
                            //회의 끝
                            {
                                "type": "static_select",
                                "placeholder": {
                                    "type": "plain_text",
                                    "text": "회의 종료 시각",
                                    "emoji": true
                                },
                                "options": [
                                    ...this.endTime
                                ],
                                "initial_option": {
                                    "text": {
                                        "type": "plain_text",
                                        "text": bookingInfo.end,
                                        "emoji": true
                                    },
                                    "value": bookingInfo.end
                                },
                                "action_id": "meeting_end"
                            }
                        ]
                    },
                    //참석자
                    {
                        "type": "input",
                        "element": {
                            "type": "multi_users_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "Select users",
                                "emoji": true
                            },
                            "action_id": "participant_list",
                            initial_users: userIdList
                        },
                        "label": {
                            "type": "plain_text",
                            "text": "미팅 참여자",
                            "emoji": true
                        }
                    },
                ]
            };
            const args = {
                token: slack_1.default.token,
                trigger_id: trigger_id,
                view: JSON.stringify(editModal)
            };
            const result = yield axios_1.default.post('https://slack.com/api/views.open', qs.stringify(args));
        });
        this.sendDm = (userList, user, bookingInfo) => __awaiter(this, void 0, void 0, function* () {
            const blocks = [{
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "미팅에 초대되었습니다."
                    }
                },
                {
                    "type": "",
                    "text": {
                        "type": "mrkdwn",
                        "text": `*Topic:*\n${bookingInfo.title}\n*When:*\n${bookingInfo.date} ${bookingInfo.start} ~ ${bookingInfo.end}\n*회의실:* ${bookingInfo.room_number}\n*Details:* ${bookingInfo.description}`
                    },
                    "accessory": {
                        "type": "image",
                        "image_url": "https://api.slack.com/img/blocks/bkb_template_images/approvalsNewDevice.png",
                        "alt_text": "computer thumbnail"
                    }
                },
            ];
            for (let i = 0; i < userList.length; i++) {
                const args = {
                    token: slack_1.default.token,
                    channel: userList[i],
                    blocks: JSON.stringify(blocks),
                    text: '미팅 예약 메세지확인'
                };
                console.log(args);
                const result = yield axios_1.default.post('https://slack.com/api/chat.postMessage', qs.stringify(args));
                console.log(result);
            }
        });
        this.getUserId = (booking_id) => __awaiter(this, void 0, void 0, function* () {
            const result = yield globals_1.dbs.Participant.findAll({ booking_id: booking_id });
            const userId = _.map(result, (user) => {
                return user.dataValues.user_id;
            });
            return userId;
        });
    }
}
/* todo: res.sendStatus() 고치기
        modal 빈값 에러처리
        time 시작 종료값
* */
exports.default = new slackController;
//# sourceMappingURL=slackController.js.map