import tempSaver from "./tempSaver";
import blockManager from "./blockManager";
import slackConfig from "../../config/slack";
import axios from "axios";
import qs from "qs";
import * as moment from "moment-timezone";
import timeManager from "./timeManager";


class SlackManager {
    private businessTime = ['10:00', '19:00']
    private isEdit: boolean = false;
    private meetingId: number = 0;

    initLocalData(user_id: string) {
        tempSaver.deleteForm(user_id);
        this.isEdit = false;
        this.meetingId = 0;
    }

    async event(req: any) {
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

    // action(){
    //     //modal submission
    //     if (type === 'view_submission') {
    //
    //         const submitType = view.submit.text
    //
    //         if (submitType.toLowerCase() === 'edit') {
    //
    //             await meetingController.editMeeting(tempSaver.meetingForm(user.id), this.meetingId, user)
    //                 .then(() => {
    //                     res.send(blockManager.updateConfirmModal("예약 수정이 완료되었습니다."))
    //                 })
    //                 .catch((e) => {
    //                     res.send(blockManager.updateConfirmModal(e.message))
    //                 })
    //
    //         }
    //         else {
    //             await meetingController.createMeeting(tempSaver.meetingForm(user.id), user)
    //                 .then(() => {
    //                     res.send(blockManager.updateConfirmModal("예약이 완료되었습니다."))
    //                 })
    //                 .catch((e) => {
    //                     res.send(blockManager.updateConfirmModal(e.message))
    //                 })
    //         }
    //         this.initLocalData(user.id);
    //     }
    //     else if (type === "view_closed") {
    //         this.initLocalData(user.id);
    //     }
    // }


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
            headers: {Authorization:`Bearer ${slackConfig.token}`},
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
}

export default new SlackManager()