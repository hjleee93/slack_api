"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const moment = require("moment-timezone");
const node_fetch_1 = require("node-fetch");
const sequelize_1 = require("sequelize");
const axios_1 = require("axios");
const slack_1 = require("../../config/slack");
const globals_1 = require("../commons/globals");
const qs = require('qs');
class workTimeController {
    constructor() {
        this.workStart = (user, trigger_id) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.WorkLog.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const user_id = user.id;
                const userInfo = {
                    user_id,
                    user_name: user.username,
                };
                const workStart = {
                    user_id,
                    start: moment().format('YYYY-MM-DDTHH:mm:ss')
                };
                console.log(moment().format('yyyy-MM-DD').toString());
                const isWorkStart = yield globals_1.dbs.WorkLog.hasWorkStart(user_id);
                if (!isWorkStart) {
                    const user = yield globals_1.dbs.User.create(userInfo, transaction);
                    console.log('user', user);
                    if (!user) {
                        // res.status(500).send('Create User for slack failure')
                    }
                    else {
                        const time = yield globals_1.dbs.WorkLog.create(workStart, transaction);
                        if (!time) {
                            // res.status(500).send(`Create WorkLog for ${userInfo.userName}  failure`)
                        }
                        yield this.openModal(trigger_id, '출근 처리되었습니다.');
                    }
                }
                else {
                    yield this.openModal(trigger_id, '이미 출근처리되었습니다.');
                }
            }));
        });
        this.workEnd = (user, trigger_id) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.WorkLog.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const user_id = user.id;
                const workEnd = moment().format('YYYY-MM-DDTHH:mm:ss');
                const isWorkStart = yield globals_1.dbs.WorkLog.hasWorkStart(user_id);
                const isWorkEnd = yield globals_1.dbs.WorkLog.hasWorkEnd(user_id);
                if (isWorkEnd) {
                    yield this.openModal(trigger_id, '이미 퇴근하셨습니다.');
                }
                else if (isWorkStart) {
                    const workDone = yield globals_1.dbs.WorkLog.update({ end: workEnd }, { user_id: user_id });
                    if (workDone[0] === 1) {
                        yield this.openModal(trigger_id, '퇴근 처리되었습니다. ');
                    }
                    else {
                        // res.status(500).send('Update slack failure. (id: ' + user_id + ')')
                    }
                }
                else {
                    yield this.openModal(trigger_id, '출근기록이 없습니다. 출근 버튼 먼저 눌러주세요');
                }
            }));
        });
        this.openModal = (trigger_id, text) => __awaiter(this, void 0, void 0, function* () {
            const modal = {
                "response_action": "update",
                "view": {
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
            };
            const args = {
                token: slack_1.default.token,
                trigger_id: trigger_id,
                view: JSON.stringify(modal)
            };
            console.log('args', args);
            const result = yield axios_1.default.post('https://slack.com/api/views.open', qs.stringify(args));
            console.log(result);
        });
        this.openCalender = (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            };
            (0, node_fetch_1.default)(new URL(`${req.body.response_url}`), {
                method: 'post',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            })
                .catch((err) => {
                res.status.send('response err');
            });
            res.send();
        });
        this.workHistory = (user, historyDuration, trigger_id) => __awaiter(this, void 0, void 0, function* () {
            console.log(historyDuration);
            const user_id = user.id;
            const workHistory = yield globals_1.dbs.WorkLog.findAll({
                user_id,
                start: {
                    [sequelize_1.Op.gt]: moment().subtract(historyDuration, 'days').toDate()
                }
            });
            const result = _.map(workHistory, (log) => {
                return {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `${new Date(log.start).toLocaleDateString()}     *|*       ${new Date(log.start).toLocaleTimeString()}      *|*      ${new Date(log.end).toLocaleTimeString()}\n*--------------------------------------------------------------------*`
                    }
                };
            });
            return result;
        });
        this.findHistory = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const response = JSON.parse(req.body.payload);
            console.log('actions', response.actions);
            const user_id = response.user.id;
            const workHistory = yield globals_1.dbs.WorkLog.findAll({
                where: { user_id },
            });
            const result = _.map(workHistory, (log) => {
                return {
                    start: log.start,
                    end: log.end,
                    is_야근: true,
                    초과근무: true,
                };
            });
            // res.send(result)
            // const body = {
            //     text: '최근 한달간의 근태 기록입니다.',
            //     response_type: "ephemeral"
            // };
            console.log(moment().subtract(3, 'm').format('yyyy-MM-DD'));
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
        });
    }
}
exports.default = new workTimeController;
//# sourceMappingURL=workTimeController.js.map