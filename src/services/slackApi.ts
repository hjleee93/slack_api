import slackConfig from "../../config/slack";
import axios from "axios";
import * as qs from "qs";
import blockManager from "./blockManager";
import {dbs} from "../commons/globals";

const url = {
    view_publish: 'https://slack.com/api/views.publish',
    chat_post_msg: 'https://slack.com/api/chat.postMessage',
}

function apiPost(url: string, args: any) {
    return axios.post(url, args);
}

class SlackApi {

    displayHome = async (user_id: any, block: any) => {

        const args = {
            token: slackConfig.token,
            user_id,
            view: JSON.stringify({
                type: 'home',
                title: {
                    type: 'plain_text',
                    text: 'FTR'
                },
                blocks: block
            })
        };

        return await apiPost(url.view_publish, qs.stringify(args))
    }

    sendDm = async ({members, meetingInfo, text, type}: any) => {
        let blocks: any = [];
        if (type === 'delete') {
            blocks = blockManager.deleteDmJson(meetingInfo);
        }
        else if (type === 'edit') {
            blocks = blockManager.editDmJson(meetingInfo);
        }
        else if (type === 'create') {
            blocks = blockManager.dmJson(meetingInfo);
        }
        const msgObj: any = [];

        for (let i = 0; i < members.length; i++) {

            const args = {
                token: slackConfig.token,
                channel: members[i].user_id,
                blocks: JSON.stringify(blocks),
                text
            };

            const result = await axios.post(url.chat_post_msg, qs.stringify(args));
            msgObj.push(result)
        }

        return msgObj;
    }

    meetingDm = async (blocks:any,channel_id: string ) =>{
        const args = {
            token: slackConfig.token,
            channel: channel_id,
            blocks: JSON.stringify(blocks),
        };

         await axios.post(url.chat_post_msg, qs.stringify(args));


    }

    deleteDm = async (deleteList: any[]) => {

        // {channel: result.channel_id, ts: result.message_id}
        for (let i = 0; i < deleteList.length; i++) {
            const args = {
                token: slackConfig.token,
                ts: deleteList[i].message_id,
                channel: deleteList[i].channel_id,
            };

            await axios.post('https://slack.com/api/chat.delete', qs.stringify(args));
        }
    }

    updateDm = async ({channel, ts, meetingInfo}: any) => {

        const args = {
            token: slackConfig.token,
            ts,
            channel,
            blocks: JSON.stringify(blockManager.editDmJson(meetingInfo))
        };

        await axios.post('https://slack.com/api/chat.update', qs.stringify(args));

    }

    getChannelList = async ()=>{
        const result = await axios.get('https://slack.com/api/conversations.list',{
            headers: {Authorization: `Bearer ${slackConfig.token}`}
        })
        return result;
    }

    async updateModal(modal: any, view_id: any) {
        const args = {
            token: slackConfig.token,
            view: JSON.stringify(modal),
            view_id: view_id
        };
        await axios.post('https://slack.com/api/views.update', qs.stringify(args))

    }

    async errorModal(modal: any, trigger_id: any) {
        const args = {
            token: slackConfig.token,
            trigger_id,
            view: JSON.stringify(modal)
        };

        const result = await axios.post('https://slack.com/api/views.push', qs.stringify(args))
        console.log(result)
    }


    openModal = async (modal: any, trigger_id: any) => {

        const args = {
            token: slackConfig.token,
            trigger_id,
            view: JSON.stringify(modal)
        };

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
        return result;
    };

    async getUserInfo(user_id: string) {
        return await axios.get('https://slack.com/api/users.info', {
            headers: {Authorization: `Bearer ${slackConfig.token}`},
            params: {
                user: user_id
            }
        })
    }

    getBotInfo = async () => {
        const result = await axios.get('https://slack.com/api/bots.info', {
            headers: {Authorization: `Bearer ${slackConfig.token}`},
        })
        console.log(result)
    }

    getDmList = async (user_id: string) => {
        const result = await axios.get('https://slack.com/api/conversations.history', {
            headers: {Authorization: `Bearer ${slackConfig.token}`},
            params: {
                channel: user_id
            }
        })
        return result;
    }
}

export default new SlackApi();