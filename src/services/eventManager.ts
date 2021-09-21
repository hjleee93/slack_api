import blockManager from "./blockManager";
import slackApi from "./slackApi";
import {dbs} from "../commons/globals";
import * as _ from "lodash";
import tempSaver from "./tempSaver";

class eventManager {


    async openHome(user_id: any) {

        const startTime = await dbs.WorkLog.hasWorkStart(user_id)
        const meetings = await dbs.Meeting.meetingList()
        let meetingList!: any;

        if (meetings?.length === 0) {
            meetingList = blockManager.noMeeting();

        }
        else {
            meetingList = _.map(meetings, (list: any) => {
                return blockManager.meetingList(list, user_id)
            })
        }
        let homeBlock = [
            // blockManager.home.header(),
            // blockManager.home.workAlarm(startTime ? startTime.start : ''),
            // ...blockManager.workSection(),
            // blockManager.divider(),
            ...blockManager.meetingSection(),
            ...meetingList
        ];
        await slackApi.displayHome(user_id, homeBlock);
    }

    async editMeeting(meeting_id: number, user: any, trigger_id: string) {
        try {


            const meetingInfo = await dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), meeting_id, user)
            const allMsgUsers = await dbs.Meeting.allMsgUsers(meeting_id)
            let members: any[] = [...allMsgUsers.msgs, ...allMsgUsers.participants]
            members = _.uniqBy(members, "user_id");

            await slackApi.deleteDm(allMsgUsers.msgs)
            await slackApi.sendDm({members, meetingInfo, text: '회의가 수정되었습니다. 확인해주세요 ', type: 'edit'});
        } catch (e: any) {
            await blockManager.openConfirmModal(trigger_id, e.message)
        }

    }


    async createMeeting(user: any, trigger_id: string, view_id?: string) {
        try {
            const {meetingInfo, meetingId} = await dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user)
            const msgInfo: any[] = await slackApi.sendDm({
                members: meetingInfo.members,
                meetingInfo, text: '회의가 예약되었습니다. 확인해주세요', type: 'create'
            })
            await dbs.Msg.createMsg(msgInfo, meetingId, meetingInfo)

            // setTimeout(()=>{
            //  blockManager.openConfirmModal(trigger_id, "예약이 완료되었습니다.")
            // },300)


        } catch (e: any) {
            await blockManager.openConfirmModal(trigger_id, e.message)
        }
    }

    async updateModal(form: any, view_id: string, isEdit: boolean) {
        const timeList: any = await blockManager.timeList(form)
        const modal = await blockManager.updateModal({initData: form, timeList, isEdit})
        await slackApi.updateModal(modal, view_id)

    }

    async openModal(form: any, trigger_id: string, isEdit: boolean) {
        const timeList: any = await blockManager.timeList(form);
        const modal = await blockManager.updateModal({initData: form, timeList, isEdit})

        await slackApi.openModal(modal, trigger_id);

    }
}

export default new eventManager();