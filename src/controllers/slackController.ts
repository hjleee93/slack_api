import * as _ from 'lodash';
import axios from "axios"
import * as moment from 'moment-timezone';

import slackConfig from '../../config/slack';

import workController from './workTimeController'
import meetingController from "./meetingController";
import viewController from "./viewController";
import workTimeController from "./workTimeController";
import {dbs} from "../commons/globals";

import blockManager from "../sevices/blockManager";
import timeManager from "../sevices/timeManager";
import tempSaver from "../sevices/tempSaver";


const qs = require('qs');


class slackController {

    private businessTime = ['10:00', '19:00']
    private isEdit: boolean = false;
    private meetingId: number = 0;


    initLocalData(user_id: string) {
        tempSaver.deleteForm(user_id);
        this.isEdit = false;
        this.meetingId = 0;
    }

    event = async (req: any, res: any) => {
        res.send(req.body)
        const {type, user, channel, tab, text, subtype} = req.body.event;
        if (type === 'app_home_opened') {
            let homeBlock = [
                ...blockManager.workSection(),
                blockManager.divider(),
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

                await meetingController.editMeeting(tempSaver.meetingForm(user.id), this.meetingId, user)
                    .then(() => {
                        res.send(blockManager.updateConfirmModal("예약 수정이 완료되었습니다."))
                    })
                    .catch((e) => {
                        res.send(blockManager.updateConfirmModal(e.message))
                    })

            } else {
                await meetingController.createMeeting(tempSaver.meetingForm(user.id), user)
                    .then(() => {
                        res.send(blockManager.updateConfirmModal("예약이 완료되었습니다."))
                    })
                    .catch((e) => {
                        res.send(blockManager.updateConfirmModal(e.message))
                    })
            }
            this.initLocalData(user.id);
        } else if (type === "view_closed") {
            this.initLocalData(user.id);
        }

        //form actions

        if (actions && actions[0].action_id.match(/work_start/)) {

            await workController.workStart(user, trigger_id)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch(() => {
                    res.sendStatus(500);
                })

        } else if (actions && actions[0].action_id.match(/work_end/)) {
            await workController.workEnd(user, trigger_id)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch(() => {
                    res.sendStatus(500);
                })

        } else if (actions && actions[0].action_id.match(/work_history/)) {
            const historyDuration = actions[0].value;
            const result = await workController.workHistory(user, historyDuration);

            const history_block = [
                ...blockManager.workSection(),
                blockManager.history.title(historyDuration),
                blockManager.history.header(),
                ...result,
                blockManager.divider(),
                ...blockManager.meetingSection()
            ]

            await this.displayHome(user.id, history_block)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch(() => {
                    res.sendStatus(500);
                });

        } else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            tempSaver.createData(user.id);

            await this.openMeetingModal(trigger_id)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch((e) => {
                    res.sendStatus(500);
                })


        } else if (actions && actions[0].action_id.match(/meeting_list/)) {
            const clickedType = actions[0].value
            const result = await meetingController.meetingList(user, trigger_id, clickedType)

            const list_block = [
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
                ...result,
            ]
            await this.displayHome(user.id, list_block)

        } else if (actions && actions[0].action_id.match(/room_number/)) {
            const form: any = tempSaver.updateRoom(user.id, actions[0].selected_option.value);
            const result = timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);

            const modal = await blockManager.updateModal(form, await result, this.isEdit)

            const args = {
                token: slackConfig.token,
                view: JSON.stringify(modal),
                view_id: container.view_id
            };

            console.log(await axios.post('https://slack.com/api/views.update', qs.stringify(args)))
            res.sendStatus(200);
        } else if (actions && actions[0].action_id.match(/meeting_title/)) {
            tempSaver.updateTitle(user.id, actions[0].value)

            res.sendStatus(200);
        } else if (actions && actions[0].action_id.match(/description/)) {
            tempSaver.updateDesc(user.id, actions[0].value)

            res.sendStatus(200);
        } else if (actions && actions[0].action_id.match(/selected_date/)) {
            let result !: any
            const form = tempSaver.updateDate(user.id, actions[0].selected_date);
            console.log(form)

            //오늘 날짜 선택한 경우
            const remainder = 15 - moment().minute() % 15
            if (actions[0].selected_date === moment().format('yyyy-MM-DD')) {
                result = timeManager.timeList(form.duration, [moment().add(remainder, 'm').format('HH:mm'), '19:00'], form.date, form.room_number)
            } else {
                result = timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);
            }
            const modal = await blockManager.updateModal(form, await result, this.isEdit)

            const args = {
                token: slackConfig.token,
                view: JSON.stringify(modal),
                view_id: container.view_id
            };

            console.log(await axios.post('https://slack.com/api/views.update', qs.stringify(args)))

        } else if (actions && actions[0].action_id.match(/meeting_duration/)) {
            const duration = actions[0].selected_option.value
            const form: any = tempSaver.updateDuration(user.id, duration)

            let result !: any

            //오늘 날짜 선택한 경우
            const remainder = 15 - moment().minute() % 15
            if (form.date === moment().format('yyyy-MM-DD')) {

                result = await timeManager.timeList(form.duration, [moment().add(remainder, 'm').format('HH:mm'), '19:00'], form.date, form.room_number)
            } else {
                result = await timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);
            }


            // const result: any = timeManager.timeList(duration, this.businessTime, form.date, form.room_number)
            const modal: any = await blockManager.updateModal(form, result, this.isEdit)


            const args = {
                token: slackConfig.token,
                view: JSON.stringify(modal),
                view_id: container.view_id
            };
            console.log(await axios.post('https://slack.com/api/views.update', qs.stringify(args)))


        } else if (actions && actions[0].action_id.match(/select_meeting_option/)) {
            tempSaver.deleteForm(user.id);
            const meeting_id = actions[0].selected_option.value

            if (actions[0].selected_option.text.text.toLowerCase() === 'edit') {
                this.isEdit = true
                this.meetingId = meeting_id;
                const meetingInfo = await dbs.Meeting.meetingInfo(meeting_id);
                const form: any = await tempSaver.createEditDate(meetingInfo, user.id);


                const result: any = await timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);
                const modal: any = await blockManager.updateModal(form, result, this.isEdit);

                const args = {
                    token: slackConfig.token,
                    view: JSON.stringify(modal),
                    trigger_id: trigger_id,
                };

                await axios.post('https://slack.com/api/views.open', qs.stringify(args))
                    .then((response:any) => {
                        console.log(response)
                        res.sendStatus(200);
                    })
                    .catch(() => {
                        res.sendStatus(500);
                    })

            } else if (actions[0].selected_option.text.text.toLowerCase() === 'delete') {

                const result = await meetingController.deleteMeeting(meeting_id, user, trigger_id)
                if (result === 1) {
                    await blockManager.openConfirmModal(trigger_id, '해당 예약은 삭제되었습니다.');
                }

                const result1 = await meetingController.meetingList(user, trigger_id)
                const list_block = [
                    ...blockManager.workSection(),
                    blockManager.divider(),
                    ...blockManager.meetingSection(),
                    ...result1

                ]
                await this.displayHome(user.id, list_block)
                    .then(() => {
                        res.sendStatus(200);
                    })
                    .catch(() => {
                        res.sendStatus(500);
                    })


            }

        } else if (actions && actions[0].action_id.match(/meeting_start/)) {
            // const modalForm = meetingController.createMeetingForm(payload.view, user).createMeeting

            // const modal = blockManager.updateEndTimeModal(modalForm, this.bookedMeetings, actions[0].selected_option.value)
            //
            // const args = {
            //     token: slackConfig.token,
            //     view: JSON.stringify(modal),
            //     view_id: container.view_id
            // };
            //
            // const result = await axios.post('https://slack.com/api/views.update', qs.stringify(args));
            //
            // console.log(result)

        } else if (actions && actions[0].action_id.match(/meeting_time/)) {

            if (actions[0].selected_option.value === 'null') {
                const form = tempSaver.updateDate(user.id, moment().add(1, 'day').format('yyyy-MM-DD'))
                const result = await timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);
                const modal: any = await blockManager.updateModal(form, result, this.isEdit)


                const args = {
                    token: slackConfig.token,
                    view: JSON.stringify(modal),
                    view_id: container.view_id
                };
                await axios.post('https://slack.com/api/views.update', qs.stringify(args))
            } else {
                tempSaver.updateTime(user.id, actions[0].selected_option.value)
            }


            res.sendStatus(200)


        } else if (actions && actions[0].action_id.match(/participant_list/)) {
            tempSaver.updateMembers(user.id, actions[0].selected_users)
            res.sendStatus(200);
        }


    }


    displayHome = async (user_id: any, block: any) => {

        const args = {
            token: slackConfig.token,
            user_id: user_id,
            view: await this.updateView(user_id, block)
        };

        return await axios.post('https://slack.com/api/views.publish', qs.stringify(args));
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

        const modal = await blockManager.meetingModal()

        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };


    sendDm = async (userList: string[], user: any, meetingInfo: any) => {

        for (let i = 0; i < userList.length; i++) {
            const args = {
                token: slackConfig.token,
                channel: userList[i],
                blocks: JSON.stringify(blockManager.dmJson(meetingInfo)),
                text: '미팅 예약 메세지확인'
            };

            await axios.post('https://slack.com/api/chat.postMessage', qs.stringify(args));

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