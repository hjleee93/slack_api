import tempSaver from "./tempSaver";
import blockManager from "./blockManager";
import slackConfig from "../../config/slack";
import axios from "axios";
import * as qs from "qs";
import * as moment from "moment-timezone";
import timeManager from "./timeManager";
import {dbs} from "../commons/globals";
import * as _ from "lodash";


class SlackManager {
    public businessTime = ['10:00', '19:00']
    private isEdit: boolean = false;
    private meetingId: number = 0;

    initLocalData(user_id: string) {
        tempSaver.deleteForm(user_id);
        this.isEdit = false;
        this.meetingId = 0;
    }

    async events(params: any) {
        const {type, user, channel, tab, text, subtype} = params.event;
        if (user) {
            const startTime = await dbs.WorkLog.hasWorkStart(user)

            if (type === 'app_home_opened') {
                let homeBlock = [
                    blockManager.home.header(),
                    blockManager.home.workAlarm(startTime ? startTime.start : ''),
                    ...blockManager.workSection(),
                    blockManager.divider(),
                    ...blockManager.meetingSection()
                ]
                await this.displayHome(user, homeBlock);
            }
        }
        return params
    }

    async actions(payload: any) {
        const {token, trigger_id, user, actions, type, container, view} = JSON.parse(payload);
        let startTime = await dbs.WorkLog.hasWorkStart(user.id)


        //modal submission
        if (type === 'view_submission') {

            const submitType = view.submit.text
            const meetingList = await dbs.Meeting.meetingList(user, trigger_id)
            if (submitType.toLowerCase() === 'edit') {

                try {
                    await dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), this.meetingId, user)
                    await blockManager.openConfirmModal(trigger_id, "예약 수정이 완료되었습니다.")
                } catch (e) {
                    await blockManager.openConfirmModal(trigger_id, e.message)
                }

            }
            else {
                dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user)
                    .then(() => {
                        blockManager.openConfirmModal(trigger_id,"예약이 완료되었습니다.")

                    })
                    .catch((e: any) => {
                        return blockManager.updateConfirmModal(e.message)
                    })
            }
            const list_block = [
                blockManager.home.header(),
                blockManager.home.workAlarm(startTime ? startTime.start : ''),
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
                ...meetingList
            ]

            await this.displayHome(user.id, list_block)
            this.initLocalData(user.id);
        }
        else if (type === "view_closed") {
            this.initLocalData(user.id);
        }


        if (actions && actions[0].action_id.match(/work_start/)) {

            const workLog = await dbs.WorkLog.workStart(user, trigger_id);

            if (!workLog) {
                await blockManager.openConfirmModal(trigger_id, '출근 처리되었습니다.');
                startTime = await dbs.WorkLog.hasWorkStart(user.id)
            }
            else {
                await blockManager.openConfirmModal(trigger_id, '이미 출근처리되었습니다.');
            }

            const blocks = [
                blockManager.home.header(),
                blockManager.home.workAlarm(startTime ? startTime.start : ''),
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
            ]
            await this.displayHome(user.id, blocks)

        }
        else if (actions && actions[0].action_id.match(/work_end/)) {
            await dbs.WorkLog.workEnd(user, trigger_id)
            // .then(() => {
            //     res.sendStatus(200);
            // })
            // .catch(() => {
            //     res.sendStatus(500);
            //     this.initLocalData(user.id);
            // })

        }
        else if (actions && actions[0].action_id.match(/work_history/)) {
            const historyDuration = actions[0].value;
            const workHistory = await dbs.WorkLog.workHistory(user.id, historyDuration);

            //@ts-ignore
            const sortedHistory = workHistory.sort((a: any, b: any) => new Date(b.start) - new Date(a.start))

            const result = _.map(sortedHistory, (log: any) => {
                return blockManager.history.body(log)
            })

            const history_block = [
                blockManager.home.header(),
                blockManager.home.workAlarm(startTime ? startTime.start : ''),
                ...blockManager.workSection(),
                blockManager.history.title(historyDuration),
                blockManager.history.header(),
                ...result,
                blockManager.divider(),
                ...blockManager.meetingSection()
            ]

            await this.displayHome(user.id, history_block)


        }
        else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            tempSaver.createData(user.id);

            await this.openMeetingModal(trigger_id)
            // .then(() => {
            //     res.sendStatus(200);
            // })
            // .catch((e) => {
            //     res.sendStatus(500);
            //     this.initLocalData(user.id);
            // })


        }
        else if (actions && actions[0].action_id.match(/meeting_list/)) {
            const clickedType = actions[0].value
            const meetingList = await dbs.Meeting.meetingList(user, trigger_id, clickedType)

            const list_block = [
                blockManager.home.header(),
                blockManager.home.workAlarm(startTime ? startTime.start : ''),
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
                ...meetingList,
            ]
            await this.displayHome(user.id, list_block);

        }
        else if (actions && actions[0].action_id.match(/room_number/)) {

            const form: any = tempSaver.updateRoom(user.id, actions[0].selected_option.value);
            const result: any = await this.timeList(form)
            const modal = await blockManager.updateModal(form, result, this.isEdit)

            await this.updateModal(modal, container.view_id)

        }
        else if (actions && actions[0].action_id.match(/meeting_title/)) {
            tempSaver.updateTitle(user.id, actions[0].value)

        }
        else if (actions && actions[0].action_id.match(/description/)) {
            tempSaver.updateDesc(user.id, actions[0].value)
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
            console.log(form)
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

                const result: any = await this.timeList(form[user.id]);
                const modal = await blockManager.updateModal(form[user.id], result, this.isEdit);

                await this.openEditModal(modal, trigger_id);

            }
            else if (actions[0].selected_option.text.text.toLowerCase() === 'delete') {

                const deleteMeeting = await dbs.Meeting.deleteMeeting(meeting_id)
                if (deleteMeeting === 1) {
                    await blockManager.openConfirmModal(trigger_id, '해당 예약은 삭제되었습니다.');
                }

                const meetingList = await dbs.Meeting.meetingList(user, trigger_id)

                const list_block = [
                    blockManager.home.header(),
                    blockManager.home.workAlarm(startTime ? startTime.start : ''),
                    ...blockManager.workSection(),
                    blockManager.divider(),
                    ...blockManager.meetingSection(),
                    ...meetingList

                ]
                await this.displayHome(user.id, list_block)


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


        }
        else if (actions && actions[0].action_id.match(/participant_list/)) {
            tempSaver.updateMembers(user.id, actions[0].selected_users)
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

    async updateModal(modal: any, view_id: any) {
        const args = {
            token: slackConfig.token,
            view: JSON.stringify(modal),
            view_id: view_id
        };

        await axios.post('https://slack.com/api/views.update', qs.stringify(args))

    }

    async timeList(form: any) {
        let result !: any
        //오늘 날짜 선택한 경우
        const remainder = 15 - moment().minute() % 15
        if (form.date === moment().format('yyyy-MM-DD')) {
            result = await timeManager.timeList(form.duration, [moment().add(remainder, 'm').format('HH:mm'), '19:00'], form.date, form.room_number)
        }
        else {
            result = await timeManager.timeList(form.duration, this.businessTime, form.date, form.room_number);
        }

        return result;

    }

    async getUserInfo(user_id: string) {
        return await axios.get('https://slack.com/api/users.info', {
            headers: {Authorization: `Bearer ${slackConfig.token}`},
            params: {
                user: user_id
            }
        })

    }

    openMeetingModal = async (trigger_id: any) => {

        const modal = await blockManager.meetingModal()

        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };

    openEditModal = async (modal: any, trigger_id: any) => {


        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

    await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };
}

export default new SlackManager()