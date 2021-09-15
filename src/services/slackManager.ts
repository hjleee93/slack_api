import tempSaver from "./tempSaver";
import blockManager from "./blockManager";
import * as moment from "moment-timezone";
import timeManager from "./timeManager";
import {dbs} from "../commons/globals";
import * as _ from "lodash";
import slackApi from "./slackApi";
import eventManager from "./eventManager";


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

        const {type, user, channel, tab, text, subtype} = params.event || params;

        const user_id: string = user;

        if (user_id) {
            if (type === 'app_home_opened') {
                await eventManager.openHome(user_id)
                await dbs.User.createUser(user_id)
            }
        }
        return params
    }

    async slashCommand(params: any){
        const {token, team_id, channel_id, user_id, user_name, command, trigger_id} = JSON.parse(params);

        if(command === '/회의실예약'){
            tempSaver.createData(user_id);
            const modal = await blockManager.meetingModal()
            await slackApi.openModal(modal, trigger_id)
        }

    }


    async actions(payload: any) {
        const {token, trigger_id, user, actions, type, container, view, callback_id} = JSON.parse(payload);
        //user{id:string, username:string, name:string, team_id: string}

        let startTime = await dbs.WorkLog.hasWorkStart(user.id)

        //modal submission
        if (type === 'view_submission') {

            const submitType = view.submit.text
            const meetingList = await dbs.Meeting.meetingList(user);
            if (submitType.toLowerCase() === 'edit') {
                await eventManager.editMeeting(this.meetingId, user, trigger_id);

            } else {
                dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user)
                    .then(() => {
                        blockManager.openConfirmModal(trigger_id, "예약이 완료되었습니다.")

                    })
                    .catch((e: any) => {
                        return blockManager.updateConfirmModal(e.message)
                        // blockManager.openConfirmModal(trigger_id, e.message)
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
        } else if (type === "view_closed") {
            this.initLocalData(user.id);
        }


        if (actions && actions[0].action_id.match(/work_start/)) {

            const workLog = await dbs.WorkLog.workStart(user, trigger_id);

            if (!workLog) {
                await blockManager.openConfirmModal(trigger_id, '출근 처리되었습니다.');
                startTime = await dbs.WorkLog.hasWorkStart(user.id)
            } else {
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

            const result = _.map(workHistory, (log: any) => {
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
        else if (actions && actions[0].action_id.match(/meeting_booking/) || callback_id&& callback_id.match(/meeting_booking/)) {
            tempSaver.createData(user.id);
            const modal = await blockManager.meetingModal()
            await slackApi.openModal(modal, trigger_id)



        } else if (actions && actions[0].action_id.match(/meeting_list/)) {

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

        } else if (actions && actions[0].action_id.match(/room_number/)) {

            const form: any = tempSaver.updateRoom(user.id, actions[0].selected_option.value);
            const timeList: any = await blockManager.timeList(form)
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})

            await slackApi.updateModal(modal, container.view_id)

        } else if (actions && actions[0].action_id.match(/meeting_title/)) {
            tempSaver.updateTitle(user.id, actions[0].value)

        } else if (actions && actions[0].action_id.match(/description/)) {
            tempSaver.updateDesc(user.id, actions[0].value)
        } else if (actions && actions[0].action_id.match(/selected_date/)) {

            const form = tempSaver.updateDate(user.id, actions[0].selected_date);

            const timeList: any = await blockManager.timeList(form);
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


            await slackApi.updateModal(modal, container.view_id)

        } else if (actions && actions[0].action_id.match(/meeting_duration/)) {
            const duration = actions[0].selected_option.value
            const form: any = tempSaver.updateDuration(user.id, duration)


            const timeList: any = await blockManager.timeList(form);
            const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


            await slackApi.updateModal(modal, container.view_id)


        }
        else if (actions && actions[0].action_id.match(/select_meeting_option/)) {

            const meeting_id = actions[0].selected_option.value
            const meetingInfo = await dbs.Meeting.meetingInfo(meeting_id);
            const form: any = (await tempSaver.createEditData(meetingInfo, user.id))[user.id];
            if (actions[0].selected_option.text.text.toLowerCase() === 'Edit Meeting'.toLowerCase()) {
                this.isEdit = true
                this.meetingId = meeting_id;

                const timeList: any = await blockManager.timeList(form);
                const modal = await blockManager.updateModal({initData: form, timeList, isEdit: this.isEdit})


                await slackApi.openModal(modal, trigger_id);

            } else if (actions[0].selected_option.text.text.toLowerCase() === 'Cancel Meeting'.toLowerCase()) {

                const deleteMeeting = await dbs.Meeting.deleteMeeting(meeting_id, user)
                if (deleteMeeting === 1) {

                    const members = await dbs.Participant.findAllUser(meeting_id)


                    await blockManager.openConfirmModal(trigger_id, '해당 예약은 삭제되었습니다.');
                    const result = await dbs.Message.getMsgInfo(meeting_id)

                    await slackApi.deleteDm({channel: result.channel_id, ts: result.message_id})
                    //삭제 디엠 보내기
                    await slackApi.sendDm({
                        members,
                        meetingInfo: form,
                        type: 'delete',
                        text: '회의가 취소되었습니다. 알림을 확인해주세요'
                    });
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
            } else {
                tempSaver.updateTime(user.id, actions[0].selected_option.value)
            }


        } else if (actions && actions[0].action_id.match(/participant_list/)) {
            tempSaver.updateMembers(user.id, actions[0].selected_users)
        }

    }


}

export default new SlackManager()