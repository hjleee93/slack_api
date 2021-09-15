import blockManager from "./blockManager";
import slackApi from "./slackApi";
import {dbs} from "../commons/globals";
import * as _ from "lodash";
import tempSaver from "./tempSaver";

class eventManager {


    async openHome(user_id: any) {

        const startTime = await dbs.WorkLog.hasWorkStart(user_id)
        const meetings = await dbs.Meeting.meetingList()

        const meetingList = _.map(meetings, (list: any) => {
            return blockManager.meetingList(list, user_id)
        })

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
            //중복유저 제거
            const members = await dbs.Participant.findAllUser(meeting_id);
            console.log(members)
            const meetingInfo = await dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), meeting_id, user)
            console.log(meetingInfo.members)
            await blockManager.openConfirmModal(trigger_id, "예약 수정이 완료되었습니다.")

            const memberList: any[] = [...members, ...meetingInfo.members]
            console.log(memberList)
            const msgInfo = await dbs.Message.getMsgInfo(meeting_id)
            const result = await slackApi.deleteDm({channel: msgInfo.channel_id, ts: msgInfo.message_id})
            // await slackApi.updateDm({channel:result.channel_id, ts:result.message_id, meetingInfo})
            //기존 유저 + 새로운 유저한테 보내야됨 수정해야됨
            await slackApi.sendDm({memberList, meetingInfo, text: '회의가 수정되었습니다. 확인해주세요 ', type: 'edit'});
        } catch (e) {
            await blockManager.openConfirmModal(trigger_id, e.message)
        }

    }

}

export default new eventManager();