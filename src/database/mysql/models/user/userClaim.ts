import Model from '../../../_base/model';
import { DataTypes, Sequelize, Transaction } from 'sequelize';
import { dbs } from '../../../../commons/globals';
import { IZempieClaims } from '../../../../controllers/_interfaces';


class UserClaimModel extends Model {
    protected initialize(): void {
        this.name = 'userClaim';
        this.attributes = {
            user_id:        { type: DataTypes.INTEGER, allowNull: false },
            user_uid:       { type: DataTypes.STRING(36), allowNull: false },
            data:           { type: DataTypes.JSON, allowNull: false },
        }
    }


    async createDefault(user_id: number, user_uid: string) {
        return await this.create({
            user_id,
            user_uid,
            data: JSON.stringify({
                zempie: {
                    is_developer: false,
                    deny: {},
                }
            } as IZempieClaims)
        })
    }


    async getZempieClaim(user_id: number, user_uid: string) {
        let userClaim = await this.findOne({ user_id });
        if ( !userClaim ) {
            userClaim = await this.createDefault(user_id, user_uid);
        }
        return userClaim;
    }

}


export default (rdb: Sequelize) => new UserClaimModel(rdb)
