import * as _ from 'lodash';
import axios from "axios"
import * as moment from 'moment-timezone';

import slackConfig from '../../config/slack';

import workController from './workTimeController'
import meetingController from "./meetingController";
import viewController from "./viewController";
import workTimeController from "./workTimeController";
import {dbs} from "../commons/globals";


import * as meeting_done_modal from "../json/booking_done_modal.json";
import * as meeting_edit_done_modal from "../json/booking_edit_done_modal.json";
import blockManager from "../sevices/blockManager";


const qs = require('qs');

class slackController {
    private meetingData = {
        id: null,
        roomNumber: null,
        title: null,
        description: null,
        date: moment().format('yyyy-MM-DD'),
        duration: null,
        start: null,
        end: null,
        members: []
    }

    private businessTime = ['10:00','19:00']
    private startTime = viewController.setStartTime();
    private endTime = viewController.setEndTime();
    private bookedMeetings !: any;

    initData() {
        this.meetingData = {
            id: null,
            roomNumber: null,
            title: null,
            description: null,
            date: moment().format('yyyy-MM-DD'),
            duration: null,
            start: null,
            end: null,
            members: []
        }

        this.bookedMeetings = null;
    }


    event = async (req: any, res: any) => {
        res.send(req.body)
        const {type, user, channel, tab, text, subtype} = req.body.event;
        if (type === 'app_home_opened') {
            let homeBlock = [
                ...blockManager.workSection(),
                {
                    "type": "divider"
                },
                ...blockManager.meetingSection()

            ]
            await this.displayHome(user, homeBlock);
        }
    }

    actions = async (req: any, res: any) => {

        const {token, trigger_id, user, actions, type, container, view} = JSON.parse(req.body.payload);
        const payload = JSON.parse(req.body.payload);

        //modal submission
        if (type === 'view_submission') {

            const submitType = payload.view.submit.text

            if (submitType.toLowerCase() === 'edit') {
                await meetingController.editMeeting(payload.view, this.meetingData.id, user)
                res.send(meeting_edit_done_modal)
            }
            else {
                await meetingController.createMeeting(payload.view, user);
                res.send(meeting_done_modal)
            }
        }
        else if (type === "view_closed") {
            this.initData();
        }

        if (actions && actions[0].action_id.match(/work_start/)) {

            try {
                await workController.workStart(user, trigger_id)
                res.sendStatus(200);
            } catch (e) {
                res.sendStatus(500);
            }
        }
        else if (actions && actions[0].action_id.match(/work_end/)) {
            await workController.workEnd(user, trigger_id)
            res.sendStatus(200);
        }
        else if (actions && actions[0].action_id.match(/work_history/)) {
            const historyDuration = actions[0].value;
            const result = await workController.workHistory(user, historyDuration);

            const history_block = [
                ...blockManager.workSection(),
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
                        "text": "*-------------------------------------------------------------------------*\n          *날짜         |          출근 시간          |          퇴근 시간          *\n*-------------------------------------------------------------------------*"
                    }
                },
                ...result,
                {
                    "type": "divider"
                },
                ...blockManager.meetingSection()

            ]

            const response = await this.displayHome(user.id, history_block);

            if (response.data.error) {
                res.sendStatus(500)
            }
            else {
                res.sendStatus(200);
            }

        }
        else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            await this.openMeetingModal(trigger_id);
            res.sendStatus(200);

        }
        else if (actions && actions[0].action_id.match(/meeting_list/)) {
            const clickedType = actions[0].value
            const result = await meetingController.meetingList(user, trigger_id, clickedType)

            const list_block = [
                ...blockManager.workSection(),
                {
                    "type": "divider"
                },
                ...blockManager.meetingSection(),
                ...result

            ]
            await this.displayHome(user.id, list_block)

        }
        else if (actions && actions[0].action_id.match(/meeting_edit/)) {

            const meeting_id = actions[0].value;
            const meetingInfo = await meetingController.getMeetingInfo(meeting_id, user);

            await this.openEditModal(trigger_id, meetingInfo);

        }
        else if (actions && actions[0].action_id.match(/selected_date/)) {
            this.meetingData.date = actions[0].selected_date;


            // const modalForm = meetingController.createMeetingForm(payload.view, user).createMeeting
            // this.bookedMeetings = await dbs.Meeting.hasMeetingOnDate(this.meetingData.date, modalForm.room_number)
            //
            //
            // // this.startTime = viewController.setStartTime(timeList)
            //
            // const modal = blockManager.updateMeetingModal(modalForm, this.bookedMeetings)


            // blockManager(meetingInfo, userIdList)

            // const modal = {
            //     type: 'modal',
            //     "title":
            //         {
            //             "type":
            //                 "plain_text",
            //             "text":
            //                 "My App",
            //             "emoji":
            //                 true
            //         }
            //     ,
            //     "submit":
            //         {
            //             "type":
            //                 "plain_text",
            //             "text":
            //                 "Submit",
            //             "emoji":
            //                 true
            //         }
            //     ,
            //     "close":
            //         {
            //             "type":
            //                 "plain_text",
            //             "text":
            //                 "Cancel",
            //             "emoji":
            //                 true
            //         }
            //     ,
            //     blocks: [
            //         // Text input
            //         {
            //             "type": "section",
            //             "block_id": "meeting-identifier",
            //             "text": {
            //                 "type": "plain_text",
            //                 "text": "선택부탁",
            //                 "emoji": true
            //             }
            //         },
            //         {
            //             "type": "input",
            //             "element": {
            //                 "type": "static_select",
            //                 "placeholder": {
            //                     "type": "plain_text",
            //                     "text": "Select an item",
            //                     "emoji": true
            //                 },
            //                 "options": [
            //                     {
            //                         "text": {
            //                             "type": "plain_text",
            //                             "text": "302",
            //                             "emoji": true
            //                         },
            //                         "value": "302"
            //                     },
            //                     {
            //                         "text": {
            //                             "type": "plain_text",
            //                             "text": "402",
            //                             "emoji": true
            //                         },
            //                         "value": "402"
            //                     },
            //
            //                 ],
            //                 "action_id": "room_number"
            //             },
            //             "label": {
            //                 "type": "plain_text",
            //                 "text": "회의실",
            //                 "emoji": true
            //             }
            //         },
            //         {
            //             "type": "input",
            //             "element": {
            //                 "type": "plain_text_input",
            //                 "action_id": "title"
            //             },
            //             "label": {
            //                 "type": "plain_text",
            //                 "text": "안건",
            //                 "emoji": true
            //             }
            //         },
            //         {
            //             "type": "input",
            //
            //             "element": {
            //                 "type": "plain_text_input",
            //                 "multiline": true,
            //                 "action_id": "description",
            //
            //             },
            //             "label": {
            //                 "type": "plain_text",
            //                 "text": "자세히",
            //                 "emoji": true
            //             },
            //             "optional": true
            //         },
            //         {
            //             "type": "input",
            //             dispatch_action: true,
            //             "element": {
            //                 "type": "datepicker",
            //                 "initial_date": moment().format('yyyy-MM-DD'),
            //                 "action_id": "selected_date"
            //             },
            //             "label": {
            //                 "type": "plain_text",
            //                 "text": "미팅 할 날짜",
            //                 "emoji": true
            //             }
            //         },
            //         {
            //             "type": "actions",
            //             "elements": [
            //                 {
            //                     "type": "static_select",
            //                     "placeholder": {
            //                         "type": "plain_text",
            //                         "text": "회의 시작 시각",
            //                         "emoji": true
            //                     },
            //                     "options": [
            //
            //
            //                         ...this.startTime
            //                     ],
            //                     "action_id": "meeting_start"
            //                 },
            //                 //회의 끝
            //                 {
            //                     "type": "static_select",
            //                     "placeholder": {
            //                         "type": "plain_text",
            //                         "text": "회의 종료 시각",
            //                         "emoji": true
            //                     },
            //                     "options": [
            //                         ...this.endTime
            //
            //                     ],
            //                     "action_id": "meeting_end"
            //                 }
            //             ]
            //         },
            //         //참석자
            //         {
            //             "type": "input",
            //             "element": {
            //                 "type": "multi_users_select",
            //                 "placeholder": {
            //                     "type": "plain_text",
            //                     "text": "Select users",
            //                     "emoji": true
            //                 },
            //                 "action_id": "participant_list"
            //             },
            //             "label": {
            //                 "type": "plain_text",
            //                 "text": "미팅 참여자",
            //                 "emoji": true
            //             }
            //         },
            //
            //     ]
            // }

            // const args = {
            //     token: slackConfig.token,
            //     view: JSON.stringify(modal),
            //     view_id: container.view_id
            // };
            //
            //
            // const result = await axios.post('https://slack.com/api/views.update', qs.stringify(args));

            res.sendStatus(200);

        }
        else if (actions && actions[0].action_id.match(/meeting_duration/)) {
            this.meetingData.duration=  actions[0].selected_option.value;
            const duration = this.meetingData.duration;
         // console.log(moment().add(90, 'm').format("HH:mm"))
            console.log(this.meetingData.date + 'T'+this.businessTime[0])
const time = moment(this.meetingData.date + 'T'+this.businessTime[0]).add(duration,'m').format('HH:mm')
            console.log(time)


            // console.log(this.meetingData.date)

        }
        else if (actions && actions[0].action_id.match(/select_meeting_option/)) {

            const meeting_id = actions[0].selected_option.value

            if (actions[0].selected_option.text.text.toLowerCase() === 'edit') {
                const meetingInfo = await dbs.Meeting.meetingInfo(meeting_id);
                await this.openEditModal(trigger_id, meetingInfo);
            }
            else if (actions[0].selected_option.text.text.toLowerCase() === 'delete') {

                const result = await meetingController.deleteMeeting(meeting_id, user, trigger_id)
                if (result === 1) {
                    await blockManager.openConfirmModal(trigger_id, '해당 예약은 삭제되었습니다.');
                }

                const result1 = await meetingController.meetingList(user, trigger_id)
                const list_block = [
                    ...blockManager.workSection(),
                    {
                        "type": "divider"
                    },
                    ...blockManager.meetingSection(),
                    ...result1

                ]
                await this.displayHome(user.id, list_block)
                res.sendStatus(200);

            }

        }
        else if (actions && actions[0].action_id.match(/meeting_start/)) {
            const modalForm = meetingController.createMeetingForm(payload.view, user).createMeeting

            const modal = blockManager.updateEndTimeModal(modalForm, this.bookedMeetings, actions[0].selected_option.value)

            const args = {
                token: slackConfig.token,
                view: JSON.stringify(modal),
                view_id: container.view_id
            };

            const result = await axios.post('https://slack.com/api/views.update', qs.stringify(args));

            console.log(result)

        }
        else if (actions && actions[0].action_id.match(/meeting_end/)) {


        }


    }

    displayHome = async (user_id: any, block: any) => {

        const args = {
            token: slackConfig.token,
            user_id: user_id,
            view: await this.updateView(user_id, block)
        };

        const result = await axios.post('https://slack.com/api/views.publish', qs.stringify(args));


        return result
    }
    updateView = async (user: any, blocks: any) => {

        let view = {
            type: 'home',
            title: {
                type: 'plain_text',
                text: 'FTR'
            },
            blocks: blocks
        }

        return JSON.stringify(view);
    };


    openMeetingModal = async (trigger_id: any) => {

        const modal = blockManager.meetingModal()


        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
        console.log(result)

    };

    openEditModal = async (trigger_id: any, meetingInfo: any) => {

        //initial_users
        const userIdList = await this.getUserId(meetingInfo.id);
        // this.meetingId = meetingInfo.id;

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

                        ],
                        "initial_option": {
                            "text": {
                                "type": "plain_text",
                                "text": meetingInfo.room_number,
                                "emoji": true
                            },
                            "value": meetingInfo.room_number
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
                        "initial_value": meetingInfo.title
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
                        "initial_value": meetingInfo.description
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
                        "initial_date": meetingInfo.date,
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select a date",
                            "emoji": true
                        },
                        "action_id": "selected_date"
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
                                    "text": `${meetingInfo.start}:00`,
                                    "emoji": true
                                },
                                "value": meetingInfo.start
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
                                    "text": `${meetingInfo.end}:00`,
                                    "emoji": true
                                },
                                "value": meetingInfo.end
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
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(editModal)
        };

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
    }


    sendDm = async (userList: string[], user: any, meetingInfo: any) => {

        for (let i = 0; i < userList.length; i++) {
            const args = {
                token: slackConfig.token,
                channel: userList[i],
                blocks: JSON.stringify(blockManager.dmJson(meetingInfo)),
                text: '미팅 예약 메세지확인'
            };

            const result = await axios.post('https://slack.com/api/chat.postMessage', qs.stringify(args));

        }
    }

    getUserId = async (meeting_id: string,) => {
        const result = await dbs.Participant.findAll({meeting_id: meeting_id})

        const userId = _.map(result, (user) => {
            return user.dataValues.user_id
        })

        return userId

    }


}

export default new slackController;