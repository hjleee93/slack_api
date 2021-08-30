import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import sequelize from 'sequelize';
import fetch from "node-fetch"
import {Op, Transaction} from 'sequelize';

import axios from "axios";

import slackConfig from '../../config/slack';
import {dbs} from "../commons/globals";
import blockManager from "../sevices/blockManager";

const qs = require('qs');

class workTimeController {

    workStart = async (user: any, trigger_id: any) => {

        return dbs.WorkLog.getTransaction(async (transaction: Transaction) => {
            const user_id = user.id;

            const userInfo = {
                user_id,
                user_name: user.username,
            };

            const workStart = {
                user_id,
                start: moment().format('YYYY-MM-DDTHH:mm:ss')
            }
            const isWorkStart = await dbs.WorkLog.hasWorkStart(user_id)


            if (!isWorkStart) {
                if (!dbs.User.findUser(user_id)) {
                    const user = await dbs.User.create(userInfo, transaction)
                }

                //
                // console.log('user', user)
                //
                // if (!user) {
                //     // res.status(500).send('Create User for slack failure')
                // } else {
                const time = await dbs.WorkLog.create(workStart, transaction)

                if (!time) {
                    // res.status(500).send(`Create WorkLog for ${userInfo.userName}  failure`)
                }
                await this.openModal(trigger_id, '출근 처리되었습니다.');


                // }
            }
            else {
                await this.openModal(trigger_id, '이미 출근처리되었습니다.');
            }
        })
    };

    workEnd = async (user: any, trigger_id: any) => {
        return dbs.WorkLog.getTransaction(async (transaction: Transaction) => {
            const user_id = user.id;
            const workEnd = moment().format('YYYY-MM-DDTHH:mm:ss');

            const isWorkStart = await dbs.WorkLog.hasWorkStart(user_id)

            const isWorkEnd = await dbs.WorkLog.hasWorkEnd(user_id)


            if (isWorkEnd) {
                await this.openModal(trigger_id, '이미 퇴근하셨습니다.');
            }
            else if (isWorkStart) {
                const workDone = await dbs.WorkLog.update({end: workEnd}, {user_id: user_id});

                if (workDone[0] === 1) {

                    await this.openModal(trigger_id, '퇴근 처리되었습니다. ');
                }
                else {
                    // res.status(500).send('Update slack failure. (id: ' + user_id + ')')
                }

            }
            else {
                await this.openModal(trigger_id, '출근기록이 없습니다. 출근 버튼 먼저 눌러주세요');
            }
        })
    }


    openModal = async (trigger_id: any, text: string) => {

        const modal = blockManager.confirmModal(text)

        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));

    };


    openCalender = async (req: any, res: any) => {

        const body = {
            "title": {
                "type": "plain_text",
                "text": "Add info to feedback",
                "emoji": true
            },
            "submit": {
                "type": "plain_text",
                "text": "Save",
                "emoji": true
            },
            "type": "modal",
            "blocks": [
                {
                    "type": "input",
                    "element": {
                        "type": "plain_text_input"
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "Label",
                        "emoji": true
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Test block with multi conversations select"
                    },
                    "accessory": {
                        "type": "multi_conversations_select",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select conversations",
                            "emoji": true
                        },
                        "action_id": "multi_conversations_select-action"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": "Pick a date for the deadline."
                    },
                    "accessory": {
                        "type": "datepicker",
                        "initial_date": "1990-04-28",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "Select a date",
                            "emoji": true
                        },
                        "action_id": "datepicker-action"
                    }
                }
            ]
        }


        fetch(new URL(`${req.body.response_url}`), {
            method: 'post',
            body: JSON.stringify(body),
            headers: {'Content-Type': 'application/json'}
        })
            .catch((err: any) => {
                res.status.send('response err')
            })

        res.send()
    }

    workHistory = async (user: any, historyDuration: string, trigger_id: string) => {
        console.log(historyDuration)
        const user_id = user.id;
        const workHistory = await dbs.WorkLog.findAll({

            user_id,
            start: {
                [Op.gt]: moment().subtract(historyDuration, 'days').toDate()
            }
        })

        const result = _.map(workHistory, (log: any) => {
            return {
                "type": "section",
                "text":
                    {
                        "type": "mrkdwn",
                        "text": `${new Date(log.start).toLocaleDateString()}     *|*       ${new Date(log.start).toLocaleTimeString()}      *|*      ${new Date(log.end).toLocaleTimeString()}\n*--------------------------------------------------------------------*`
                    }
            }
        })

        return result;
    }

    findHistory = async (req: any, res: any) => {

        const response = JSON.parse(req.body.payload);

        const user_id = response.user.id;


        const workHistory = await dbs.WorkLog.findAll({
            where: {user_id},
        })

        const result = _.map(workHistory, (log: any) => {
            return {
                start: log.start,
                end: log.end,
                is_야근: true,
                초과근무: true,
            }
        })
        // res.send(result)

        // const body = {
        //     text: '최근 한달간의 근태 기록입니다.',
        //     response_type: "ephemeral"
        // };
        console.log(moment().subtract(3, 'm').format('yyyy-MM-DD'))


        // const workHistory = await SlackUser.findOne({
        //     where: {user_id},
        //     include: [
        //         {
        //             model: WorkLog,
        //             // attributes: ['user_id','start', 'end'],
        //             // required: true
        //         },
        //
        //     ],
        // })

    }


}


export default new workTimeController;