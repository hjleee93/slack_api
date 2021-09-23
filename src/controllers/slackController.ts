import slackManager from "../services/slackManager";
import slackApi from "../services/slackApi";
import {dbs} from "../commons/globals";
import blockManager from "../services/blockManager";
import * as _ from "lodash";
import * as moment from "moment-timezone";
import tempSaver from "../services/tempSaver";
import {eMeetingList} from "../commons/enums";

class slackController {

    events = async (params: any) => {
        const {token, challenge, type, event} = params;
        return await slackManager.events(params)
    }

    actions = async ({payload}: any) => {
        return await slackManager.actions(payload)
    }

    meeting_list = async (params: any) => {
        await meetingList(params, eMeetingList.all);
    }

    my_meetings = async (params: any) => {
        await meetingList(params, eMeetingList.mine);

    }
    today_meetings = async (params: any) => {
        await meetingList(params, eMeetingList.date, new Date());
    }

    meeting_booking = async (params: any) => {
        tempSaver.createData(params.user_id);
        const modal = await blockManager.meetingModal()
        await slackApi.openModal(modal, params.trigger_id)
    }

}

async function meetingList(params: any, list_type: number, date?:Date) {
    let meetings!: any;
    let info :any ={};
    switch (list_type) {
        case eMeetingList.all:
            meetings = await dbs.Meeting.meetingList()
            info = blockManager.allMeetingList();
            break;
        case eMeetingList.mine:
            meetings = await dbs.Meeting.meetingList(params.user_id)
            info = blockManager.userMeetingList(params.user_id, params.user_name)
            break;
        case eMeetingList.date:
            meetings = await dbs.Meeting.meetingList(undefined, new Date(moment(date).format('yyyy-MM-DD')))
            info = blockManager.dateMeetingInfo(date || new Date())
            break;
        default:
            meetings = await dbs.Meeting.meetingList()
    }

    // const meetings = await dbs.Meeting.meetingList()
    let meetingList!: any;

    if (meetings?.length === 0) {
        meetingList = blockManager.noMeeting();
    } else {
        meetingList = _.map(meetings, (list: any) => {
            return blockManager.meetingList(list, params.user_id)
        })
    }

    let msgBlock = [
        blockManager.divider(),
        info,
        ...meetingList
    ];
    await slackApi.meetingDm(msgBlock, params.user_id);

}

export default new slackController;