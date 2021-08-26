import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import sequelize from 'sequelize';
import fetch from "node-fetch"
import { Op, Transaction } from 'sequelize';

import axios from "axios";

import slackConfig from '../../config/slack';
import {dbs} from "../commons/globals";

const qs = require('qs');

const SlackUser = dbs.SlackUser;
const WorkLog = dbs.WorkLog;

class workTimeController {

    basicApi = async (req: any, res: any) => {
        console.log(req)

        res.send();
    }

    workStart = async (user: any, trigger_id: any) => {
        const user_id = user.id;
        const condition = user_id ? {where: {user_id: user_id}} : null;

        const userInfo = {
            user_id,
            user_name: user.username,
        };

        const workStart = {
            user_id,
            start: moment().format('YYYY-MM-DDTHH:mm:ss')
        }
        console.log(moment().format('yyyy-MM-DD').toString())

        const isWorkStart = await WorkLog.findOne({
            where: {
                user_id,
                start: {
                    //범위
                    [Op.gte]: moment().format('yyyy-MM-DD').toString(),
                    [Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                }
            }
        })

        console.log('userInfo', userInfo)

        if (!isWorkStart) {
            const user = await SlackUser.create(userInfo)

            console.log('user', user)

            if (!user) {
                // res.status(500).send('Create User for slack failure')
            } else {
                const time = await WorkLog.create(workStart)

                if (!time) {
                    // res.status(500).send(`Create WorkLog for ${userInfo.userName}  failure`)
                }
                await this.openModal(trigger_id, '출근 처리되었습니다.');


            }
        } else {
            await this.openModal(trigger_id, '이미 출근처리되었습니다.');
        }
    };

    workEnd = async (user: any, trigger_id: any) => {
        const user_id = user.id;
        const workEnd = moment().format('YYYY-MM-DDTHH:mm:ss');

        const isWorkStart = await WorkLog.findOne({
            where: {
                user_id,
                start: {
                    //범위
                    [Op.gte]: moment().format('yyyy-MM-DD').toString(),
                    [Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                }
            }
        })

        const isWorkEnd = await WorkLog.findOne({
            where: {
                user_id,
                end: {
                    //범위
                    [Op.gte]: moment().format('yyyy-MM-DD').toString(),
                    [Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                }
            }
        })


        if (isWorkEnd) {
            await this.openModal(trigger_id, '이미 퇴근하셨습니다.');
        } else if (isWorkStart) {
            const workDone = await WorkLog.update({end: workEnd},
                {where: {user_id}})

            if (workDone[0] === 1) {

                await this.openModal(trigger_id, '퇴근 처리되었습니다. ');
            } else {
                // res.status(500).send('Update slack failure. (id: ' + user_id + ')')
            }

        } else {
            await this.openModal(trigger_id, '출근기록이 없습니다. 출근 버튼 먼저 눌러주세요');
        }
    }


    openModal = async (trigger_id: any, text: string) => {

        const modal = {
            "type": "modal",
            "title": {
                "type": "plain_text",
                "text": "My App",
                "emoji": true
            },

            "close": {
                "type": "plain_text",
                "text": "ok",
                "emoji": true
            },
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "plain_text",
                        "text": text,
                        "emoji": true
                    }
                }
            ]
        }
        const args = {
            token: slackConfig.token,
            trigger_id: trigger_id,
            view: JSON.stringify(modal)
        };
        console.log('args', args)

        const result = await axios.post('https://slack.com/api/views.open', qs.stringify(args));
        console.log(result)
    };


    // findAll = (req: any, res: any) => {
    //     // const title = req.query.title;
    //     let condition = {where: {}};
    //
    //     // if (keyword) {
    //     //     condition = { where: { [Op.or]: [{ title: { [Op.like]: `%${keyword}%` } }, { description: { [Op.like]: `%${keyword}%` } }] } }
    //     // };
    //     Slack.findAll(condition)
    //         .then((data: any) => {
    //             res.send(data);
    //         })
    //         .catch((err: { message: any; }) => {
    //             res.status(500).send({message: err.message || 'Retrieve all slack failure.'});
    //         });
    // };



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
        const workHistory = await WorkLog.findAll({
            where: {
                user_id,
                start: {
                    [Op.gt]: moment().subtract(historyDuration, 'days').toDate()
                }
            },


        })

        const result = _.map(workHistory, (log: any) => {

            // return {
            //     start: log.start,
            //     end: log.end,
            //     is_야근: true,
            //     초과근무: true,
            // }
            return {
                "type": "section",
                "fields": [
                    {
                        "type": "plain_text",
                        "text": `날짜 : ${moment().subtract(historyDuration, 'days').toDate()}`,
                        "emoji": true
                    },
                    {
                        "type": "plain_text",
                        "text": ' ',
                        "emoji": true
                    },
                    {
                        "type": "plain_text",
                        "text": `출근 시간`,
                        "emoji": true
                    },
                    {
                        "type": "plain_text",
                        "text": new Date(log.start).toLocaleTimeString(),
                        "emoji": true
                    }, {
                        "type": "plain_text",
                        "text": `퇴근 시간`,
                        "emoji": true
                    },
                    {
                        "type": "plain_text",
                        "text": new Date(log.end).toLocaleTimeString(),
                        "emoji": true
                    },
                ]
            }
        })
        // let obj = {}
        // for (let i in result) {
        // 
        //     obj = {...obj, ...result[i]}
        //   
        //
        // }

        return result;

    }

    findHistory = async (req: any, res: any) => {

        const response = JSON.parse(req.body.payload);

        console.log('actions', response.actions)

        const user_id = response.user.id;


        const workHistory = await WorkLog.findAll({
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