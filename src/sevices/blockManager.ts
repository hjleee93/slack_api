import * as moment from "moment-timezone";
import viewController from "../controllers/viewController";
import * as _ from "lodash";
import slackConfig from "../../config/slack";
import axios from "axios";
import qs from "qs";

class BlockManager {
    private startTime = viewController.setStartTime();
    private endTime = viewController.setEndTime();

    openConfirmModal = async (trigger_id: any, text: string) => {

        const modal = this.confirmModal(text)

        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };

    meetingRoom(){
        const meetingRoomArr = [302, 402];

        const result = _.map(meetingRoomArr, (room: any) => {

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
    confirmModal(text: string) {

        const blocks =
            {
                "type": "modal",
                "title": {
                    "type": "plain_text",
                    "text": "My App",
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


        return blocks;

    }

    dmJson(meetingInfo: any) {

        const blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ":calendar: 미팅에 초대되었습니다."
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*${meetingInfo.title}* \n\`${meetingInfo.date} ${meetingInfo.start} ~ ${meetingInfo.end}\`\n*회의실:* ${meetingInfo.room_number}\n*Details:* ${meetingInfo.description}`
                }

            },
        ]
        return blocks;
    }

    workSection() {
        const blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "FTR",
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


    meetingModal() {

        const modal = {
            type: 'modal',
            notify_on_close: true,
            "title":
                {
                    "type":
                        "plain_text",
                    "text":
                        "회의실 예약",
                    "emoji":
                        true
                }
            ,
            "submit":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Submit",
                    "emoji":
                        true
                }
            ,
            "close":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Cancel",
                    "emoji":
                        true
                }
            ,
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
                        "options": [
                             ...this.meetingRoom()
                        ],
                        "initial_option": {
                            "text": {
                                "type": "plain_text",
                                "text": `${this.meetingRoom()[0].value}`,
                                "emoji": true
                            },
                            "value": `${this.meetingRoom()[0].value}`
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
                        "initial_value": ' '
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
                        "initial_value": ' '

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
                            "options": [

                                ...this.endTime
                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${this.endTime[0].value}:00`,
                                    "emoji": true
                                },
                                "value": `${this.endTime[0].value}`
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
                        // initial_users: userIdList
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

    updateMeetingModal(initData: any, meetings?: any) {

        let timeList: any[] = [];
        let startTimeList = [];
        let endTimeList = [];

        let meetingList = meetings.sort((a: any, b: any) => a.start - b.start);
        if (meetingList) {
            _.forEach(meetingList, (meeting: any) => {
                timeList.push({
                    start: meeting.start, end: meeting.end
                })
            })
            startTimeList = viewController.setStartTime(timeList);
        }

        startTimeList = viewController.setStartTime(timeList)
        endTimeList = viewController.setEndTime(startTimeList[0].value, startTimeList)

        if(!startTimeList.includes(initData.start)){
         initData.start =    startTimeList[0].value
        }


        const modal = {
            type: 'modal',
            "title":
                {
                    "type":
                        "plain_text",
                    "text":
                        "회의실 예약",
                    "emoji":
                        true
                }
            ,
            "submit":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Submit",
                    "emoji":
                        true
                }
            ,
            "close":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Cancel",
                    "emoji":
                        true
                }
            ,
            blocks: [
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
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "title",
                        "initial_value": initData.title
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
                        "initial_value": initData.description

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
                                ...startTimeList

                            ],
                            //todo:오늘 날짜기준으로 시간 다시 맞춰야함
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${initData.start}:00`,
                                    "emoji": true
                                },
                                "value": `${initData.start}`
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
                                // ...this.endTime
                                // ...startTimeList
                                ...endTimeList
                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${endTimeList[0].value}:00`,
                                    "emoji": true
                                },
                                "value": `${endTimeList[0].value}`
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
                        // initial_users: userIdList
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

    updateEndTimeModal(initData: any, meetings?: any, startTime ?: number) {

        let timeList: any[] = [];
        let startTimeList = [];
        let endTimeList = [];

        let meetingList = meetings.sort((a: any, b: any) => a.start - b.start);
        if (meetingList) {
            _.forEach(meetingList, (meeting: any) => {
                timeList.push({
                    start: meeting.start, end: meeting.end
                })
            })
            startTimeList = viewController.setStartTime(timeList);
        }

        startTimeList = viewController.setStartTime(timeList)
        endTimeList = viewController.setEndTime(startTime)

        if(!startTimeList.includes(initData.start)){
            initData.start =  startTimeList[0].value
        }


        const modal = {
            type: 'modal',
            "title":
                {
                    "type":
                        "plain_text",
                    "text":
                        "회의실 예약",
                    "emoji":
                        true
                }
            ,
            "submit":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Submit",
                    "emoji":
                        true
                }
            ,
            "close":
                {
                    "type":
                        "plain_text",
                    "text":
                        "Cancel",
                    "emoji":
                        true
                }
            ,
            blocks: [
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
                    "element": {
                        "type": "plain_text_input",
                        "action_id": "title",
                        "initial_value": initData.title
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
                        "initial_value": initData.description

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
                                ...startTimeList

                            ],
                            //todo:오늘 날짜기준으로 시간 다시 맞춰야함
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${startTime}:00`,
                                    "emoji": true
                                },
                                "value": `${startTime}`
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
                                // ...this.endTime
                                // ...startTimeList
                                ...endTimeList
                            ],
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${endTimeList[0].value}:00`,
                                    "emoji": true
                                },
                                "value": `${endTimeList[0].value}`
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
                        // initial_users: userIdList
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

}

export default new BlockManager()