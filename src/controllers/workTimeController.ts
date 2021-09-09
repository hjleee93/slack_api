import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import {Op, Transaction} from 'sequelize';


import {dbs} from "../commons/globals";

import blockManager from "../sevices/blockManager";


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
                start: moment().toDate()
            }
            const isWorkStart = await dbs.WorkLog.hasWorkStart(user_id, transaction)

            if (!isWorkStart) {
                if (!dbs.User.findUser(user_id)) {
                    await dbs.User.create(userInfo, transaction)
                }

                await dbs.WorkLog.create(workStart, transaction)
                await blockManager.openConfirmModal(trigger_id, '출근 처리되었습니다.');
            } else {
                await blockManager.openConfirmModal(trigger_id, '이미 출근처리되었습니다.');
            }
        })
    };

    workEnd = async (user: any, trigger_id: any) => {
        return dbs.WorkLog.getTransaction(async (transaction: Transaction) => {
            const user_id = user.id;
            const isWorkStart = await dbs.WorkLog.hasWorkStart(user_id)
            const isWorkEnd = await dbs.WorkLog.hasWorkEnd(user_id)


            if (isWorkEnd) {
                await blockManager.openConfirmModal(trigger_id, '이미 퇴근하셨습니다.');
            } else if (isWorkStart) {
                const workDone = await dbs.WorkLog.update({end: moment().toDate()}, {user_id: user_id, id:isWorkStart.id},transaction);

                if (workDone[0] === 1) {
                    await blockManager.openConfirmModal(trigger_id, '퇴근 처리되었습니다. ');
                } else {
                    await blockManager.openConfirmModal(trigger_id, '퇴근 처리에 실패하였습니다.');
                }
            } else {
                await blockManager.openConfirmModal(trigger_id, '출근기록이 없습니다. 출근 버튼 먼저 눌러주세요');
            }
        })
    }


    workHistory = async (user: any, historyDuration: string) => {
        const user_id = user.id;

        let workHistory = await dbs.WorkLog.findAll({
            user_id,
            start: {
                [Op.gt]: moment().subtract(historyDuration, 'days').toDate()
            }
        })

        //@ts-ignore
        workHistory = workHistory.sort((a: any, b: any) => new Date(b.start) - new Date(a.start))

        const result = _.map(workHistory, (log: any) => {

            return {
                "type": "section",
                "text":
                    {
                        "type": "mrkdwn",
                        "text": `${new Date(log.start).toLocaleDateString()}     *|*       ${new Date(log.start).toLocaleTimeString()}      *|*      ${log.end ? new Date(log.end).toLocaleTimeString() : '퇴근 기록이 없습니다.'}\n*-------------------------------------------------------------------------*`
                    }
            }
        })

        return result;
    }

}


export default new workTimeController;