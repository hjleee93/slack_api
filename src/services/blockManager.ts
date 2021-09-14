import * as moment from "moment-timezone";

import * as _ from "lodash";
import slackConfig from "../../config/slack";
import axios from "axios";
import * as qs from "qs";
import timeManager from "./timeManager";
import slackManager from "./slackManager";

class BlockManager {
    public meetingRoomArr = ['302', '402'];

    history = {
        title(duration: any) {
            return {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": `${moment().subtract(duration, 'days').format('yyyy-MM-DD')} ~ ${moment().format('yyyy-MM-DD')} 출퇴근 기록`,
                    "emoji": true
                }
            }
        },
        header() {
            return {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "*-------------------------------------------------------------------------*\n          *날짜         |          출근 시간          |          퇴근 시간          *\n*-------------------------------------------------------------------------*"
                }
            }
        },
        body(log: any) {
            return {
                "type": "section",
                "text":
                    {
                        "type": "mrkdwn",
                        "text": `${new Date(log.start).toLocaleDateString()}     *|*       ${new Date(log.start).toLocaleTimeString()}      *|*      ${log.end ? new Date(log.end).toLocaleTimeString() : '퇴근 기록이 없습니다.'}\n*-------------------------------------------------------------------------*`
                    }
            }
        }

    }

    meeting = {
        list: (meeting: any, memberNameList: any) => {
            return   {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `📢*${meeting.title}* \n\n 참석자 : ${_.map(memberNameList, (name: any) => {
                        return ' ' + name
                    })}\n\n \`\`\`${moment(meeting.date, 'yyyy-MM-DD').format('yyyy-MM-DD')} ${moment(meeting.start, 'HH:mm:ss').format("HH:mm")} — ${moment(meeting.end, 'HH:mm:ss').format("HH:mm")}\`\`\` `
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
        }
    }

    home = {
        header: () =>{
            return {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "FTR",
                    "emoji": true
                }
            }
        },
        workAlarm: (time?:Date) => {
            return {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `${time ? `${moment(time).format('MM월 DD일')} 출근시간 : *${moment(time).format('HH시 mm분 ss초 ')}*` : `*출근하세요*`}`
                }
            }
        },
    }

    noAbleTime() {
        const block = [{
            "text": {
                "type": "plain_text",
                "text": '예약가능한 시간이 없습니다.',
                "emoji": true
            },
            "value": 'null'
        }]
        return block;
    }


    meetingRoom() {

        const result = _.map(this.meetingRoomArr, (room: string) => {

            return {
                "text": {
                    "type": "plain_text",
                    "text": `${room}`,
                    "emoji": true
                },
                "value": `${room}`
            }
        })

        return result;
    }

    dmJson(meetingInfo: any) {

        const blocks = [

            {
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
                    "text": `*주제: ${meetingInfo.title}* \n\`${moment(meetingInfo.date).format('yyyy-MM-DD')} ${moment(meetingInfo.start, 'HH:mm:ss').format('HH시 mm분')} ~ ${moment(meetingInfo.end, 'HH:mm:ss').format('HH시 mm분')}\`\n*회의실:* ${meetingInfo.room_number}\n*Details:* ${meetingInfo.description}`
                }

            },  this.divider()
        ]
        return blocks;
    }

    workSection() {
        const blocks = [
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
            }
        ]

        return blocks;

    }

    meetingSection() {

        const blocks = [
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
                            "text": "예약리스트",
                            "emoji": true
                        },
                        "value": "delete",
                        "action_id": "meeting_list2"
                    }
                ]
            }

        ]

        return blocks;

    }

    modalBase() {
        const title = {
            "type": "plain_text",
            "text": "회의실 예약",
            "emoji": true
        }
        const submit = {
            "type": "plain_text",
            "text": "Submit",
            "emoji": true
        }
        const edit = {
            "type": "plain_text",
            "text": "Edit",
            "emoji": true
        }

        const close = {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
        }
        return {title, submit, close, edit}
    }

    async meetingModal() {
        const currTime = moment().isBefore(moment(slackManager.businessTime,'HH:mm')) ? moment(slackManager.businessTime, 'HH:mm') : moment()
        //시간 반올림
        const remainder = 15 - currTime.minute() % 15

        //현재 시간 이후로만 예약가능
        const timeList: any = await timeManager.timeList(30, [currTime.add(remainder, 'm').format('HH:mm:ss'), '19:00:00'],moment().toDate(), this.meetingRoom()[0].value)

        const modal = {
            type: 'modal',
            notify_on_close: true,
            "title": this.modalBase().title,
            "submit": this.modalBase().submit,
            "close": this.modalBase().close,
            blocks: [
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an item",
                            "emoji": true
                        },
                        "options": this.meetingRoom(),
                        "initial_option": {
                            "text": {
                                "type": "plain_text",
                                "text": this.meetingRoom()[0].value,
                                "emoji": true
                            },
                            "value": this.meetingRoom()[0].value
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
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "meeting_title",
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        }
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "안건",
                        "emoji": true
                    },

                },
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "description",
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        }
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
                                "text": "기간",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `15분`,
                                        "emoji": true
                                    },
                                    "value": `15`
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `30분`,
                                        "emoji": true
                                    },
                                    "value": `30`
                                },

                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `45분`,
                                        "emoji": true
                                    },
                                    "value": `45`
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간`,
                                        "emoji": true
                                    },
                                    "value": `60`
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간 30분`,
                                        "emoji": true
                                    },
                                    "value": `90`
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `2시간`,
                                        "emoji": true
                                    },
                                    "value": `120`
                                }

                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `30분`,
                                    "emoji": true
                                },
                                "value": `30`
                            },
                            "action_id": "meeting_duration"
                        },

                        {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "사용 가능한 시간",
                                "emoji": true
                            },
                            "options": timeList,
                            "action_id": "meeting_time"
                        }
                    ]
                },
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "multi_users_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select users",
                            "emoji": true
                        },
                        "action_id": "participant_list",
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "미팅 참여자",
                        "emoji": true
                    }
                },

            ]
        }

        return modal;
    }


    async updateModal(initData: any, timeList: any[], isEdit?: boolean) {
        let initMember = {}
        let initSelectedTime = {}

        if (initData.members.length > 0) {
            initMember = {
                "type": "input",
                dispatch_action: true,
                "element": {
                    "type": "multi_users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select users",
                        "emoji": true
                    },
                    "action_id": "participant_list",
                    initial_users: initData.members
                },
                "label": {
                    "type": "plain_text",
                    "text": "미팅 참여자",
                    "emoji": true
                }
            }
        } else {
            initMember = {
                "type": "input",
                dispatch_action: true,
                "element": {
                    "type": "multi_users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select users",
                        "emoji": true
                    },
                    "action_id": "participant_list",
                },
                "label": {
                    "type": "plain_text",
                    "text": "미팅 참여자",
                    "emoji": true
                }
            }
        }
        if (initData.start && initData.end && isEdit) {
            timeList.unshift({
                "text": {
                    "type": "plain_text",
                    "text": `${moment(initData.start, 'HH:mm').format('HH:mm')} - ${moment(initData.end, 'HH:mm').format('HH:mm')}`,
                    "emoji": true
                },
                "value": `${moment(initData.start, 'HH:mm:ss').format('HH:mm')}-${moment(initData.end, 'HH:mm:ss').format('HH:mm')}`
            })

            initSelectedTime = {
                "type": "static_select",
                "placeholder": {
                    "type": "plain_text",
                    "text": "사용 가능한 시간",
                    "emoji": true
                },
                "options": timeList,
                initial_option: {
                    "text": {
                        "type": "plain_text",
                        "text": `${moment(initData.start, 'HH:mm').format('HH:mm')} - ${moment(initData.end, 'HH:mm').format('HH:mm')}`,
                        "emoji": true
                    },
                    "value": `${moment(initData.start, 'HH:mm:ss').format('HH:mm')}-${moment(initData.end, 'HH:mm:ss').format('HH:mm')}`
                },
                "action_id": "meeting_time"
            }

        } else {
            initSelectedTime =
                {
                    "type": "static_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "사용 가능한 시간",
                        "emoji": true
                    },
                    "options": timeList,
                    "action_id": "meeting_time"
                }
        }

        const modal = {
            type: 'modal',
            notify_on_close: true,
            "title": this.modalBase().title,
            "submit": isEdit ? this.modalBase().edit : this.modalBase().submit,
            "close": this.modalBase().close,
            blocks: [
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an item",
                            "emoji": true
                        },
                        "options": this.meetingRoom(),
                        "initial_option": {
                            "text": {
                                "type": "plain_text",
                                "text": `${initData.room_number}`,
                                "emoji": true
                            },
                            "value":`${initData.room_number}`
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
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "meeting_title",
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        },
                        "initial_value": initData.title,
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "안건",
                        "emoji": true
                    }
                },
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "description",
                        "initial_value": initData.description,
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        }
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
                        "initial_date": moment(initData.date).format('yyyy-MM-DD') ,
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
                                "text": "기간",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `15분`,
                                        "emoji": true
                                    },
                                    "value": '15'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `30분`,
                                        "emoji": true
                                    },
                                    "value": '30'
                                },

                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `45분`,
                                        "emoji": true
                                    },
                                    "value": '45'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간`,
                                        "emoji": true
                                    },
                                    "value": '60'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간 30분`,
                                        "emoji": true
                                    },
                                    "value": '90'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `2시간`,
                                        "emoji": true
                                    },
                                    "value": '120'
                                }

                            ],
                            initial_option: {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${initData.duration >= 60 ? initData.duration == 90 ? '1시간 30분' : initData.duration / 60 + '시간' : initData.duration + '분'}`,
                                    "emoji": true
                                },
                                "value": `${initData.duration}`
                            },
                            "action_id": "meeting_duration"
                        },
                        //회의 끝
                        initSelectedTime
                    ]
                },
                //참석자
                initMember

            ]
        }

        return modal


    }

    async editModal(initData: any, timeList: any[]) {
        let initMember = {}
        if (initData.members) {
            initMember = {
                "type": "input",
                dispatch_action: true,
                "element": {
                    "type": "multi_users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select users",
                        "emoji": true
                    },
                    "action_id": "participant_list",
                    initial_users: initData.members
                },
                "label": {
                    "type": "plain_text",
                    "text": "미팅 참여자",
                    "emoji": true
                }
            }
        } else {
            initMember = {
                "type": "input",
                dispatch_action: true,
                "element": {
                    "type": "multi_users_select",
                    "placeholder": {
                        "type": "plain_text",
                        "text": "Select users",
                        "emoji": true
                    },
                    "action_id": "participant_list",
                },
                "label": {
                    "type": "plain_text",
                    "text": "미팅 참여자",
                    "emoji": true
                }
            }
        }


        const modal = {
            type: 'modal',
            notify_on_close: true,
            "title": this.modalBase().title,
            "submit": this.modalBase().edit,
            "close": this.modalBase().close,
            blocks: [
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "static_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select an item",
                            "emoji": true
                        },
                        "options": this.meetingRoom(),
                        "initial_option": {
                            "text": {
                                "type": "plain_text",
                                "text": initData.room_number,
                                "emoji": true
                            },
                            "value": initData.room_number
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
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "meeting_title",
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        },
                        "initial_value": initData.title,
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "안건",
                        "emoji": true
                    }
                },
                {
                    "type": "input",
                    dispatch_action: true,
                    "element": {
                        "type": "plain_text_input",
                        "multiline": true,
                        "action_id": "description",
                        "initial_value": initData.description,
                        "dispatch_action_config": {
                            "trigger_actions_on": [
                                "on_character_entered"
                            ]
                        }
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
                        "initial_date": initData.date,
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
                                "text": "기간",
                                "emoji": true
                            },
                            "options": [
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `15분`,
                                        "emoji": true
                                    },
                                    "value": '15'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `30분`,
                                        "emoji": true
                                    },
                                    "value": '30'
                                },

                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `45분`,
                                        "emoji": true
                                    },
                                    "value": '45'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간`,
                                        "emoji": true
                                    },
                                    "value": '60'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `1시간 30분`,
                                        "emoji": true
                                    },
                                    "value": '90'
                                },
                                {
                                    "text": {
                                        "type": "plain_text",
                                        "text": `2시간`,
                                        "emoji": true
                                    },
                                    "value": '120'
                                }

                            ],
                            initial_option: {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${initData.duration >= 60 ? initData.duration == 90 ? '1시간 30분' : initData.duration / 60 + '시간' : initData.duration + '분'}`,
                                    "emoji": true
                                },
                                "value": `${initData.duration}`
                            },
                            "action_id": "meeting_duration"
                        },
                        //회의 끝
                        {
                            "type": "static_select",
                            "placeholder": {
                                "type": "plain_text",
                                "text": "사용 가능한 시간",
                                "emoji": true
                            },
                            "options": timeList,
                            "action_id": "meeting_time"
                        }
                    ]
                },
                //참석자
                initMember

            ]
        }

        return modal


    }

    divider() {
        return {
            "type": "divider"
        }
    }

    //모달 열린 상태에서 업데이트
    updateConfirmModal(text: string) {
        return {
            "response_action": "update",
            "view": {
                "type": "modal",
                "title": {
                    "type": "plain_text",
                    "text": "Updated view"
                },
                "close": {
                    "type": "plain_text",
                    "text": "닫기"
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": text
                        }
                    }
                ]
            }
        }

    }

    //일반 확인 모달
    openConfirmModal = async (trigger_id: any, text: string) => {

        const blocks =
            {
                "type": "modal",
                "title": {
                    "type": "plain_text",
                    "text": "FTR",
                    "emoji": true
                },
                "close": {
                    "type": "plain_text",
                    "text": "ok",
                    "emoji": true
                },
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "plain_text",
                            "text": text,
                            "emoji": true
                        }
                    }
                ]

            }


        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(blocks)
        };

       console.log( await axios.post('https://slack.com/api/views.open', qs.stringify(args)))

    };

}

export default new BlockManager()
