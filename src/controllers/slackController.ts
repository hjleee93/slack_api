import * as _ from 'lodash';
import axios, {AxiosResponse} from "axios"
import * as moment from 'moment-timezone';



import {dbs} from "../commons/globals";

import blockManager from "../services/blockManager";
import timeManager from "../services/timeManager";
import tempSaver from "../services/tempSaver";
import slackManager from "../services/slackManager";


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
        // const {type, user, channel, tab, text, subtype} = req.body.event;
        slackManager.event(req)
        // if (type === 'app_home_opened') {
        //     let homeBlock = [
        //         ...blockManager.workSection(),
        //         blockManager.divider(),
        //         ...blockManager.meetingSection()
        //
        //     ]
        //     await this.displayHome(user, homeBlock);
        // }

        res.send(req.body)
    }

    actions = async (req: any, res: any) => {
        const {token, trigger_id, user, actions, type, container, view} = JSON.parse(req.body.payload);


        //modal submission
        if (type === 'view_submission') {

            const submitType = view.submit.text

            if (submitType.toLowerCase() === 'edit') {

                await dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), this.meetingId, user)
                    .then(() => {
                        res.send(blockManager.updateConfirmModal("예약 수정이 완료되었습니다."))
                    })
                    .catch((e) => {
                        res.send(blockManager.updateConfirmModal(e.message))
                    })

            }
            else {
                await dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user)
                    .then(() => {
                        res.send(blockManager.updateConfirmModal("예약이 완료되었습니다."))
                    })
                    .catch((e) => {
                        res.send(blockManager.updateConfirmModal(e.message))
                    })
            }
            this.initLocalData(user.id);
        }
        else if (type === "view_closed") {
            this.initLocalData(user.id);
        }

        //form actions

        if (actions && actions[0].action_id.match(/work_start/)) {

            await dbs.WorkLog.workStart(user, trigger_id);

        }
        else if (actions && actions[0].action_id.match(/work_end/)) {
            dbs.WorkLog.workEnd(user, trigger_id)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch(() => {
                    res.sendStatus(500);
                    this.initLocalData(user.id);
                })

        }
        else if (actions && actions[0].action_id.match(/work_history/)) {
            const historyDuration = actions[0].value;
            const workHistory = dbs.WorkLog.workHistory(user.id, historyDuration);

            //@ts-ignore
            const  sortedHistory = workHistory.sort((a: any, b: any) => new Date(b.start) - new Date(a.start))

            const result = _.map(sortedHistory, (log: any) => {
                return blockManager.history.body(log)
            })

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
                    this.initLocalData(user.id);
                });

        }
        else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            tempSaver.createData(user.id);

            await this.openMeetingModal(trigger_id)
                .then(() => {
                    res.sendStatus(200);
                })
                .catch((e) => {
                    res.sendStatus(500);
                    this.initLocalData(user.id);
                })


        }
        else if (actions && actions[0].action_id.match(/meeting_list/)) {
            const clickedType = actions[0].value
            const result = await meetingController.meetingList(user, trigger_id, clickedType)

            const list_block = [
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
                ...result,
            ]
            await this.displayHome(user.id, list_block)

        }
        else if (actions && actions[0].action_id.match(/room_number/)) {

            const form: any = tempSaver.updateRoom(user.id, actions[0].selected_option.value);
            const result: any = await this.timeList(form)
            const modal = await blockManager.updateModal(form, result, this.isEdit)

            await this.updateModal(modal, container.view_id)

        }
        else if (actions && actions[0].action_id.match(/meeting_title/)) {
            tempSaver.updateTitle(user.id, actions[0].value)

            res.sendStatus(200);
        }
        else if (actions && actions[0].action_id.match(/description/)) {
            tempSaver.updateDesc(user.id, actions[0].value)

            res.sendStatus(200);
        }
        else if (actions && actions[0].action_id.match(/selected_date/)) {

            const form = tempSaver.updateDate(user.id, actions[0].selected_date);
            const result: any = await this.timeList(form)
            const modal = await blockManager.updateModal(form, result, this.isEdit)

            await this.updateModal(modal, container.view_id)

        }
        else if (actions && actions[0].action_id.match(/meeting_duration/)) {
            const duration = actions[0].selected_option.value
            const form: any = tempSaver.updateDuration(user.id, duration)

            const result: any = await this.timeList(form)
            const modal = await blockManager.updateModal(form, result, this.isEdit)

            await this.updateModal(modal, container.view_id)


        }
        else if (actions && actions[0].action_id.match(/select_meeting_option/)) {
            tempSaver.deleteForm(user.id);
            const meeting_id = actions[0].selected_option.value

            if (actions[0].selected_option.text.text.toLowerCase() === 'edit') {
                this.isEdit = true
                this.meetingId = meeting_id;
                const meetingInfo = await dbs.Meeting.meetingInfo(meeting_id);
                const form: any = await tempSaver.createEditDate(meetingInfo, user.id);


                const result: any = await this.timeList(form)
                const modal = await blockManager.updateModal(form, result, this.isEdit)

                await this.updateModal(modal, container.view_id)

            }
            else if (actions[0].selected_option.text.text.toLowerCase() === 'delete') {

                const result = await dbs.Meeting.deleteMeeting(meeting_id, user, trigger_id)
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
                        this.initLocalData(user.id);
                    })


            }

        }
        else if (actions && actions[0].action_id.match(/meeting_time/)) {

            if (actions[0].selected_option.value === 'null') {
                const form = tempSaver.updateDate(user.id, moment().add(1, 'day').format('yyyy-MM-DD'))
                const result: any = await this.timeList(form)
                const modal = await blockManager.updateModal(form, result, this.isEdit)

                await this.updateModal(modal, container.view_id)
            }
            else {
                tempSaver.updateTime(user.id, actions[0].selected_option.value)
            }


            res.sendStatus(200)


        }
        else if (actions && actions[0].action_id.match(/participant_list/)) {
            tempSaver.updateMembers(user.id, actions[0].selected_users)
            res.sendStatus(200);
        }


    }


















}

export default new slackController;