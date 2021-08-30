import * as moment from "moment-timezone";
import viewController from "../controllers/viewController";

class BlockManager {
    private startTime = viewController.setStartTime();
    private endTime = viewController.setEndTime();

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


    meetingModal(initData?: any) {
        console.log(initData)

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
                                "text": initData ? initData.room_number : '302',
                                "emoji": true
                            },
                            "value": initData ? initData.room_number : '302'
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
                        "initial_value": initData ? initData.title : ' '
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
                        "initial_value": initData ? initData.description : ' '

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
                        "initial_date": initData ? initData.date : moment().format('yyyy-MM-DD'),
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
                                ...this.startTime
                            ],
                            //todo:오늘 날짜기준으로 시간 다시 맞춰야함
                            "initial_option": {
                                "text": {
                                    "type": "plain_text",
                                    "text": `${initData ? initData.start + ':00' : '10:00'}`,
                                    "emoji": true
                                },
                                "value": initData ? initData.start : '10'
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
                                    "text": `${initData ? initData.end + ':00' : '11:00'}`,
                                    "emoji": true
                                },
                                "value": initData ? initData.end : '11'
                            },
                            "action_id": "meeting_end"
                        }
                    ]
                }, // {
                //     "type": "actions",
                //
                //     "elements": [
                //         {
                //             "type": "static_select",
                //             // dispatch_action: true,
                //             "placeholder": {
                //                 "type": "plain_text",
                //                 "text": "회의 시작 시각",
                //                 "emoji": true
                //             },
                //             "options": [
                //                 ...this.startTime
                //             ],
                //             "action_id": "meeting_start"
                //         },
                //         //회의 끝
                //         {
                //             "type": "static_select",
                //             "placeholder": {
                //                 "type": "plain_text",
                //                 "text": "회의 종료 시각",
                //                 "emoji": true
                //             },
                //             "options": [
                //                 ...this.endTime
                //
                //             ],
                //             "action_id": "meeting_end"
                //         }
                //     ]
                // },
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

        return modal
    }


}


export default new BlockManager()