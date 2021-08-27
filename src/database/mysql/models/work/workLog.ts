import Model from '../../../_base/model';
import {DataTypes, Op, Sequelize, Transaction} from 'sequelize';
import { dbs } from '../../../../commons/globals';
import * as moment from "moment-timezone";

class WorkLogModel extends Model {
    protected initialize(): void {
        this.name = 'workLog'
        this.attributes = {
            user_id: {type:DataTypes.STRING, allowNull: false},
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


  async hasWorkStart(user_id:any, transaction?:Transaction){
        return await this.model.findOne({
            where: {
                user_id,
                start: {
                    //범위
                    [Op.gte]: moment().format('yyyy-MM-DD').toString(),
                    [Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                }
            }
        })
  }

    async hasWorkEnd(user_id:any, transaction?:Transaction){
        return await this.model.findOne({
            where: {
                user_id,
                end: {
                    //범위
                    [Op.gte]: moment().format('yyyy-MM-DD').toString(),
                    [Op.lt]: moment().add(1, 'day').format('yyyy-MM-DD').toString(),
                }
            }
        })
    }



}


export default (rdb: Sequelize) => new WorkLogModel(rdb);
