import Model from '../../../_base/model';
import {DataTypes, Op, Sequelize, Transaction, where} from 'sequelize';
import {dbs} from '../../../../commons/globals';
import * as moment from "moment-timezone";
import blockManager from "../../../../services/blockManager";

class WorkLogModel extends Model {
    protected initialize(): void {
        this.name = 'workLog'
        this.attributes = {
            user_id: {type: DataTypes.STRING, allowNull: false},
            start: {
                type: DataTypes.DATE,
            },
            end: {
                type: DataTypes.DATE,

            },
        }
    }

    async afterSync(): Promise<void> {
        this.model.belongsTo(dbs.User.model, {foreignKey: 'user_id', targetKey: 'user_id'})
    }

    async workStart(user: any, trigger_id: any, transaction?: Transaction) {

        const user_id = user.id;

        const userInfo = {
            user_id,
            user_name: user.username,
        };

        const workStart = {
            user_id,
            start: moment().toDate()
        }

        const isWorkStart = await this.hasWorkStart(user_id)

        if (!isWorkStart) {
            if (!await dbs.User.findUser(user_id, transaction)) {
                await dbs.User.create(userInfo, transaction)
            }
            await this.model.create(workStart, transaction)
            return false;

        } else {
            return true;
        }
    }

    async workEnd(user: any, trigger_id: any, transaction?: Transaction) {

        const user_id = user.id;
        const isWorkStart = await this.hasWorkStart(user_id)
        const isWorkEnd = await this.hasWorkEnd(user_id)


        if (isWorkEnd) {
            await blockManager.openConfirmModal(trigger_id, '이미 퇴근하셨습니다.');
        } else if (isWorkStart) {

            const workDone = await this.model.update({end: moment().toDate()}, {
                where: {
                    user_id: user_id,
                    id: isWorkStart.id
                }
            }, transaction);

            if (workDone[0] === 1) {
                await blockManager.openConfirmModal(trigger_id, '퇴근 처리되었습니다.');
            } else {
                await blockManager.openConfirmModal(trigger_id, '퇴근 처리에 실패하였습니다.');
            }
        } else {
            await blockManager.openConfirmModal(trigger_id, '출근기록이 없습니다. 출근 버튼 먼저 눌러주세요');
        }

    }

    async workHistory(user_id: string, historyDuration: string) {

        return await this.model.findAll({
            where: {
                user_id,
                start: {
                    [Op.gt]: moment().subtract(historyDuration, 'days').toDate()
                }
            }
        })

    }

    async hasWorkStart(user_id: any, transaction?: Transaction) {
        return await this.model.findOne({
            where: {
                user_id,
                start: {
                    //범위
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:00'),
                }
            }
        })
    }

    async hasWorkEnd(user_id: any, transaction?: Transaction) {
        return await this.model.findOne({
            where: {
                user_id,
                start: {
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:00'),
                },
                end: {
                    //범위
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:00'),
                }
            }
        })
    }


}


export default (rdb: Sequelize) => new WorkLogModel(rdb);
