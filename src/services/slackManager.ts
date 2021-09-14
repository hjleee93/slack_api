import tempSaver from "./tempSaver";
import blockManager from "./blockManager";
import * as moment from "moment-timezone";
import timeManager from "./timeManager";
import {dbs} from "../commons/globals";
import * as _ from "lodash";
import slackApi from "./slackApi";


class SlackManager {
    public businessTime = ['10:00:00', '19:00:00']
    private isEdit: boolean = false;
    private meetingId: number = 0;

    initLocalData(user_id: string) {
        tempSaver.deleteForm(user_id);
        this.isEdit = false;
        this.meetingId = 0;
    }

    async events(params: any) {
        console.log(params)
        const {type, user, channel, tab, text, subtype} = params.event || params;

        if (user) {
            const startTime = await dbs.WorkLog.hasWorkStart(user)
            if (type === 'app_home_opened') {

                let homeBlock = [
                    blockManager.home.header(),
                    blockManager.home.workAlarm(startTime ? startTime.start : ''),
                    ...blockManager.workSection(),
                    blockManager.divider(),
                    ...blockManager.meetingSection()
                ];

                await slackApi.displayHome(user, homeBlock);
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
            const meetingList = await dbs.Meeting.meetingList(user);
            if (submitType.toLowerCase() === 'edit') {

                dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), this.meetingId, user)
                    .then(() => {
                        blockManager.openConfirmModal(trigger_id, "예약 수정이 완료되었습니다.")
                    })
                    .catch((e: any) => {
                        blockManager.openConfirmModal(trigger_id, e.message)
                    })


            }
            else {
                dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user)
                    .then(() => {
                        blockManager.openConfirmModal(trigger_id, "예약이 완료되었습니다.")

                    })
                    .catch((e: any) => {
                        blockManager.openConfirmModal(trigger_id, e.message)
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

            await slackApi.displayHome(user.id, list_block)
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
            await slackApi.displayHome(user.id, blocks)

        }
        else if (actions && actions[0].action_id.match(/work_end/)) {
            await dbs.WorkLog.workEnd(user, trigger_id)

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

            await slackApi.displayHome(user.id, history_block)


        }
        else if (actions && actions[0].action_id.match(/meeting_booking/)) {
            tempSaver.createData(user.id);
            const modal = await blockManager.meetingModal()
            await slackApi.openModal(modal, trigger_id)
            // .then(() => {
            //     res.sendStatus(200);
            // })
            // .catch((e) => {
            //     res.sendStatus(500);
            //     this.initLocalData(user.id);
            // })


        }
        else if (actions && actions[0].action_id.match(/meeting_list/)) {

            const meetingList = await dbs.Meeting.meetingList(user)

            const list_block = [
                blockManager.home.header(),
                blockManager.home.workAlarm(startTime ? startTime.start : ''),
                ...blockManager.workSection(),
                blockManager.divider(),
                ...blockManager.meetingSection(),
                ...meetingList,
            ]
            await slackApi.displayHome(user.id, list_block);

        }
        else if (actions && actions[0].action_id.match(/room_number/)) {

            const form: any = tempSaver.updateRoom(user.id, actions[0].selected_option.value);
            const timeList: any = await blockManager.timeList(form)
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})

            await slackApi.updateModal(modal, container.view_id)

        }
        else if (actions && actions[0].action_id.match(/meeting_title/)) {
            tempSaver.updateTitle(user.id, actions[0].value)

        }
        else if (actions && actions[0].action_id.match(/description/)) {
            tempSaver.updateDesc(user.id, actions[0].value)
        }
        else if (actions && actions[0].action_id.match(/selected_date/)) {

            const form = tempSaver.updateDate(user.id, actions[0].selected_date);

            const timeList: any = await blockManager.timeList(form);
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


            await slackApi.updateModal(modal, container.view_id)

        }
        else if (actions && actions[0].action_id.match(/meeting_duration/)) {
            const duration = actions[0].selected_option.value
            const form: any = tempSaver.updateDuration(user.id, duration)


            const timeList: any = await blockManager.timeList(form);
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


            await slackApi.updateModal(modal, container.view_id)


        }
        else if (actions && actions[0].action_id.match(/select_meeting_option/)) {

            const meeting_id = actions[0].selected_option.value

            if (actions[0].selected_option.text.text.toLowerCase() === 'Edit Meeting'.toLowerCase()) {
                this.isEdit = true
                this.meetingId = meeting_id;
                const meetingInfo = await dbs.Meeting.meetingInfo(meeting_id);
                const form: any = (await tempSaver.createEditData(meetingInfo, user.id))[user.id];

                const timeList: any = await blockManager.timeList(form);
                const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


                await slackApi.openModal(modal, trigger_id);

            }
            else if (actions[0].selected_option.text.text.toLowerCase() === 'Cancel Meeting'.toLowerCase()) {

                const deleteMeeting = await dbs.Meeting.deleteMeeting(meeting_id, user)
                if (deleteMeeting === 1) {

                    const members =await dbs.Participant.findAllUser(meeting_id)


                    await blockManager.openConfirmModal(trigger_id, '해당 예약은 삭제되었습니다.');
                    const result = await dbs.Message.getMsgInfo(meeting_id)
                    await slackApi.deleteDm({channel: result.channel_id, ts: result.message_id})
                //삭제 디엠 보내기
                    await slackApi.sendDm({members, meetingInfo: tempSaver.getTempForm(user.id), text: '해당 회의는 취소되었습니다.'});
                }

                const meetingList = await dbs.Meeting.meetingList(user)

                const list_block = [
                    blockManager.home.header(),
                    blockManager.home.workAlarm(startTime ? startTime.start : ''),
                    ...blockManager.workSection(),
                    blockManager.divider(),
                    ...blockManager.meetingSection(),
                    ...meetingList

                ]
                tempSaver.deleteForm(user.id);
                await slackApi.displayHome(user.id, list_block)


            }

        }
        else if (actions && actions[0].action_id.match(/meeting_time/)) {

            if (actions[0].selected_option.value === 'null') {
                const form = tempSaver.updateDate(user.id, moment().add(1, 'day').format('yyyy-MM-DD'))
                const timeList: any = await blockManager.timeList(form)
                const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})

                await slackApi.updateModal(modal, container.view_id)
            }
            else {
                tempSaver.updateTime(user.id, actions[0].selected_option.value)
            }


        }
        else if (actions && actions[0].action_id.match(/participant_list/)) {
            tempSaver.updateMembers(user.id, actions[0].selected_users)
        }

    }


}

export default new SlackManager()