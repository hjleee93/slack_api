import blockManager from "./blockManager";
import slackApi from "./slackApi";
import {dbs} from "../commons/globals";
import * as _ from "lodash";
import * as moment from "moment-timezone";
import tempSaver from "./tempSaver";
import {Transaction} from "sequelize";
import {eMeetingList} from "../commons/enums";


class eventManager {


    async openHome(user_id: any, list_type?: number) {
        const startTime = await dbs.WorkLog.hasWorkStart(user_id)
        let meetings = await dbs.Meeting.meetingList()
        let meetingList!: any;
        switch (list_type) {
            case eMeetingList.mine:
                meetings = await dbs.Meeting.meetingList(user_id)
                break;
            default:
                meetings = await dbs.Meeting.meetingList();
        }
        if (meetings?.length === 0) {
            meetingList = blockManager.noMeeting();
        } else {
            meetingList = _.map(meetings, (list: any) => {
                return blockManager.meetingList(list, user_id)
            })
        }

        let homeBlock = [
            // blockManager.home.header(),
            // blockManager.home.workAlarm(startTime ? startTime.start : ''),
            // ...blockManager.workSection(),
            // blockManager.divider(),
            ...blockManager.meetingSection(list_type),
            ...meetingList
        ];
        await slackApi.displayHome(user_id, homeBlock);
    }

    async editMeeting(meeting_id: number, user: any) {
        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {
            const editDate =tempSaver.meetingForm(user.id).date
            if(moment(editDate).isBefore(moment(new Date()).subtract(9,'hours'))){
                throw {message:'오늘날짜 이전으로는 수정이 불가합니다.'}
            }
            try {
                const meetingInfo = await dbs.Meeting.editMeeting(tempSaver.meetingForm(user.id), meeting_id, user, transaction)
                const allMsgUsers = await dbs.Meeting.allMsgUsers(meeting_id, transaction)
                let members: any[] = [...allMsgUsers.msgs, ...allMsgUsers.participants]
                members = _.uniqBy(members, "user_id");

                await slackApi.deleteDm(allMsgUsers.msgs)
                await slackApi.sendDm({members, meetingInfo, text: '회의가 수정되었습니다. 확인해주세요 ', type: 'edit'});
            } catch (e: any) {
                throw e
            }
        })

    }


    async createMeeting(user: any) {
        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {
            try {
                const {
                    meetingInfo,
                    meetingId
                } = await dbs.Meeting.createMeeting(tempSaver.meetingForm(user.id), user, transaction)
                const msgInfo: any[] = await slackApi.sendDm({
                    members: meetingInfo.members,
                    meetingInfo,
                    text: '회의가 예약되었습니다. 확인해주세요',
                    type: 'create'
                })
                await dbs.Msg.createMsg(msgInfo, meetingId, meetingInfo, transaction)
            } catch (e: any) {
                throw e
            }
        })
    }

    async deleteMeeting(meeting_id: number, user: any, meetingInfo: any) {
        return dbs.Meeting.getTransaction(async (transaction: Transaction) => {
            const deleteMeeting = await dbs.Meeting.deleteMeeting(meeting_id, user, transaction)

            if (deleteMeeting === 1) {
                const members = await dbs.Participant.findAllUser(meeting_id, transaction)
                await dbs.Participant.destroy({meeting_id}, transaction);


                const result = await dbs.Msg.getMsgInfo(meeting_id, transaction)

                await slackApi.deleteDm(result)
                //삭제 디엠 보내기
                await slackApi.sendDm({
                    members,
                    meetingInfo,
                    type: 'delete',
                    text: '회의가 취소되었습니다. 알림을 확인해주세요'
                });
            }

            tempSaver.deleteForm(user.id);
            await dbs.Msg.destroy({meeting_id}, transaction)
        })

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