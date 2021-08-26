import * as _ from 'lodash';
import axios from "axios"
import * as moment from 'moment-timezone';

import slackConfig from '../../config/slack';

import workController from './workTimeController'
import meetingController from "./meetingController";

import workTimeController from "./workTimeController";
import {dbs} from "../commons/globals";

import { Op, Transaction } from 'sequelize';
const qs = require('qs');

const Booking = dbs.Booking;
const Participant = dbs.Participant;


class slackController {


    event = async (req: any, res: any) => {
        res.send(req.body)

        const {type, user, channel, tab, text, subtype} = req.body.event;

        if (type === 'app_home_opened') {
            let homeBlock = [
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
                }
            ]
            await this.displayHome(user, homeBlock);
        }
        // res.send(req.body)
    }

    actions = async (req: any, res: any) => {


        const {token, trigger_id, user, actions, type} = JSON.parse(req.body.payload);

        //modal submission
        if (type === 'view_submission') {
            const payload = JSON.parse(req.body.payload);

            // if(actions && actions[0].action_id.match(/meeting_booking/)) {

            await meetingController.createBooking(payload.view, user);

            // }else if(actions && actions[0].action_id.match(/meeting_edit/){
            // await meetingController.editBooking(payload.view, user);
            // }
            // await this.closeModal(user)

            res.send({
                "response_action": "update",
                "view": {
                    "type": "modal",
                    "title": {
                        "type": "plain_text",
                        "text": "Updated view"
                    },
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "plain_text",
                                "text": "예약 완료됨"
                            }
                        }
                    ]
                }
            })
        }
        if (actions && actions[0].action_id.match(/work_start/)) {
            await workController.workStart(user, trigger_id)
        } else if (actions && actions[0].action_id.match(/work_end/)) {
            await workController.workEnd(user, trigger_id)
        } else if (actions && actions[0].action_id.match(/work_history/)) {
            const historyDuration = actions[0].value;
            const result = await workController.workHistory(user, historyDuration, trigger_id)

            console.log(result)
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

            ]
            console.log(history_block)
            await this.displayHome(user.id, history_block)

        } else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            await this.openModal(trigger_id);
        } else if (actions && actions[0].action_id.match(/meeting_cancel/)) {
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
            ]
            await this.displayHome(user.id, cancel_block)
        } else if (actions && actions[0].action_id.match(/meeting_list/)) {
            const clickedType = actions[0].value
            const result = await meetingController.meetingList(user, trigger_id, clickedType)
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

            ]
            await this.displayHome(user.id, list_block)

        } else if (actions && actions[0].action_id.match(/meeting_delete/)) {
            const booking_id = actions[0].value
            const result = await meetingController.deleteMeeting(booking_id, user, trigger_id)
            if (result[0] === 1) {
                await workTimeController.openModal(trigger_id, '해당 예약은 삭제되었습니다.');
            }

            const result1 = await meetingController.meetingList(user, trigger_id)
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

            ]
            await this.displayHome(user.id, list_block)

        } else if (actions && actions[0].action_id.match(/meeting_edit/)) {
            const booking_id = actions[0].value;

            const bookingInfo = await meetingController.getMeetingInfo(booking_id, user);


            await this.openEditModal(trigger_id, bookingInfo.dataValues);

        }


    }

    displayHome = async (user: any, block: any, data?: any,) => {

        const args = {
            token: slackConfig.token,
            user_id: user,
            view: await this.updateView(user, block)
        };
        // console.log(args)

        const result = await axios.post('https://slack.com/api/views.publish', qs.stringify(args));
// console.log(result)

    };

    updateView = async (user: any, blocks: any) => {

        let view = {
            type: 'home',
            title: {
                type: 'plain_text',
                text: 'Keep notes!'
            },
            blocks: blocks
        }

        return JSON.stringify(view);
    };


    //todo:input error message
    openModal = async (trigger_id: any) => {

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
                        "action_id": "description"
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
                        "initial_date": moment().format('yyyy-MM-DD'),
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


                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "09:00",
                                        "emoji": true
                                    },
                                    "value": "09:00"
                                }
                            ],
                            "action_id": "start"
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
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "11:00",
                                        "emoji": true
                                    },
                                    "value": "11:00"
                                },

                            ],
                            "action_id": "end"
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
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };
        console.log(args)

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));


    };

    openEditModal = async (trigger_id: any, bookingInfo: any) => {

        //todo: bookingInfo 값으로 id 가져오기
        //initial_users

        const editModal = {
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

                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "09:00",
                                        "emoji": true
                                    },
                                    "value": "09:00"
                                }
                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": bookingInfo.start,
                                    "emoji": true
                                },
                                "value": bookingInfo.start
                            },
                            "action_id": "start"
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
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": "11:00",
                                        "emoji": true
                                    },
                                    "value": "11:00"
                                },

                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": bookingInfo.end,
                                    "emoji": true
                                },
                                "value": bookingInfo.end
                            },
                            "action_id": "end"
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
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(editModal)
        };

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
    }


    sendDm = async(userList: string[], user: any, bookingInfo: any) =>{

        const blocks=[{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "미팅에 초대되었습니다."
            }
        },
            {
                "type": "section",
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
            // {
            //     "type": "actions",
            //     "elements": [
            //         {
            //             "type": "button",
            //             "text": {
            //                 "type": "plain_text",
            //                 "emoji": true,
            //                 "text": "Approve"
            //             },
            //             "style": "primary",
            //             "value": "click_me_123"
            //         },
            //         {
            //             "type": "button",
            //             "text": {
            //                 "type": "plain_text",
            //                 "emoji": true,
            //                 "text": "Deny"
            //             },
            //             "style": "danger",
            //             "value": "click_me_123"
            //         }
            //     ]
            // }
            ]
        for (let i = 0; i < userList.length; i++) {
            const args = {
                token: slackConfig.token,
                channel: userList[i],
                blocks: JSON.stringify(blocks),
                text:'미팅 예약 메세지확인'
            };
            console.log(args)
            const result = await axios.post('https://slack.com/api/chat.postMessage', qs.stringify(args));

            console.log(result)
        }
    }


}

export default new slackController;