import slackConfig from "../../config/slack";
import axios from "axios";
import * as qs from "qs";
import blockManager from "./blockManager";

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

        return await axios.post('https://slack.com/api/views.publish', qs.stringify(args));
    }

    sendDm = async ({members, meetingInfo, text, type}: any) => {

        for (let i = 0; i < members.length; i++) {

            const args = {
                token: slackConfig.token,
                channel: members[i].user_id,
                blocks: JSON.stringify(type === 'delete' ?blockManager.deleteDmJson(meetingInfo) : blockManager.dmJson(meetingInfo)),
                text
            };

           const result = await axios.post('https://slack.com/api/chat.postMessage', qs.stringify(args));
           return result.data
        }
    }

    deleteDm = async ({channel, ts}: any) => {

        const args = {
            token: slackConfig.token,
            ts,
            channel,
        };

        await axios.post('https://slack.com/api/chat.delete', qs.stringify(args));

    }

    updateDm = async ({channel, ts, meetingInfo}: any) => {

        const args = {
            token: slackConfig.token,
            ts,
            channel,
            blocks:JSON.stringify(blockManager.editDmJson(meetingInfo))
        };

       console.log( await axios.post('https://slack.com/api/chat.update',  qs.stringify(args)));

    }



    async updateModal(modal: any, view_id: any) {
        const args = {
            token: slackConfig.token,
            view: JSON.stringify(modal),
            view_id: view_id
        };
        await axios.post('https://slack.com/api/views.update', qs.stringify(args))
    }


    openModal = async (modal: any, trigger_id: any) => {

        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };

    async getUserInfo(user_id: string) {
        return await axios.get('https://slack.com/api/users.info', {
            headers: {Authorization: `Bearer ${slackConfig.token}`},
            params: {
                user: user_id
            }
        })
    }

    getBotInfo  =async () =>{
        const result = await axios.get( 'https://slack.com/api/bots.info',{
            headers: {Authorization: `Bearer ${slackConfig.token}`},})
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