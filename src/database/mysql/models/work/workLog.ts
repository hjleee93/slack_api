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
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:01'),
                }
            }
        })
  }

    async hasWorkEnd(user_id:any, transaction?:Transaction){
        return await this.model.findOne({
            where: {
                user_id,
                start:{
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:01'),
                },
                end: {
                    //범위
                    [Op.lte]: moment().toDate(),
                    [Op.gt]: moment().format('yyyy-MM-DDT00:00:01'),
                }
            }
        })
    }

    // async workEnd(user_id:string,id:number){
    //     return await this.model.update({
    //         end:moment().toDate(),
    //         where:{
    //             user_id,
    //             id
    //
    //         }
    //     })
    //
    // }



}


export default (rdb: Sequelize) => new WorkLogModel(rdb);
