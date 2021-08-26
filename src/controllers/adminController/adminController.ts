import { IAdmin } from '../_interfaces';
import { dbs } from '../../commons/globals';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { makePassword, signJWT, verifyPassword } from '../../commons/utils';
import { Transaction } from 'sequelize';
import * as _ from 'lodash';
import { v4 as uuid } from 'uuid';


class AdminController {
    async login(params: any, admin: IAdmin) {
        const { account, password } = params;
        const record = await dbs.Admin.findOne({account});
        if ( !record ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_USERNAME);
        }

        if ( !verifyPassword(password, record.password) ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_PASSWORD);
        }

        if ( !record.activated ) {
            throw CreateError(ErrorCodes.FORBIDDEN_ADMIN);
        }

        const access_token = signJWT({
            is_admin: true,
            id: record.id,
            uid: record.uid,
            account: record.account,
            name: record.name,
            level: record.level,
            sub_level: record.sub_level,
        }, '1d');
        const refresh_token = signJWT({
            is_admin: true,
            id: record.id,
            account: record.account,
            name: record.name,
            level: record.level,
            sub_level: record.sub_level,
        }, '30d');

        await dbs.AdminRefreshToken.getTransaction(async (transaction: Transaction) => {
            let r = await dbs.AdminRefreshToken.findOne({admin_id: record.id}, transaction)
            if (r) {
                r.token = refresh_token
                await r.save({transaction})
            } else {
                r = await dbs.AdminRefreshToken.create({admin_id: record.id, token: refresh_token}, transaction)
            }
        })

        return {
            access_token,
            refresh_token,
        }
    }



    async logout(params: any, admin: IAdmin) {

    }


    async getAccessTokens(params: any, admin: IAdmin) {
        const { token } = params;
        const access_token = await dbs.AdminRefreshToken.refresh(token);
        return {
            access_token,
        }
    }


    async verifyToken({}, admin: IAdmin) {
        return {
            id: admin.id,
            name: admin.name,
            level: admin.level,
            sub_level: admin.sub_level,
        }
    }


    /**
     * 관리자
     */
    async getAdminLogs({ admin_id, limit = 50, offset = 0, sort = 'id', dir = 'asc' }: any, admin: IAdmin) {
        const { count, rows } = await dbs.AdminLog.getLogs({ admin_id, limit, offset, sort, dir });
        return {
            count,
            logs: _.map(rows, (row: any) => {
                const admin = row.admin;
                return {
                    id: row.id,
                    admin: {
                        id: admin.id,
                        account: admin.account,
                        name: admin.name,
                        level: admin.level,
                        sub_level: admin.sub_level,
                    },
                    path: row.path,
                    body: JSON.parse(row.body),
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                }
            })
        }
    }

    async getAdmins({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }, admin: IAdmin) {
        const { count, rows } = await dbs.Admin.findAndCountAll({}, {
            attributes: {
                exclude: ['password']
            },
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        });
        return {
            count,
            admins: _.map(rows, record => record.get({ plain: true }))
        }
    }

    async addAdmin({ account, name, password, level, sub_level }: any, { id, uid }: IAdmin) {
        const admin = await dbs.Admin.findOne({ id });
        if ( admin.level < 10 ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_LEVEL)
        }

        level = _.toNumber(level);
        if ( isNaN(level) || level >= 10 || level < 1 ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_PARAMS)
        }
        sub_level = _.toNumber(level);
        if ( isNaN(sub_level) || sub_level >= 10 || sub_level < 0 ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_PARAMS)
        }

        const record = await dbs.Admin.findOne({ account });
        if ( record ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_USERNAME)
        }

        await dbs.Admin.model.create({
            uid: uuid(),
            account,
            name,
            level,
            sub_level,
            password: makePassword(password),
        })
    }

    async updateAdmin({ id: target_id, name, password, level, sub_level, activated }: any, { id, level: order_level, sub_level: order_sub_level }: IAdmin) {
        target_id = _.toNumber(target_id);

        const admin = await dbs.Admin.findOne({ id: target_id });
        if ( !admin ) {
            throw CreateError(ErrorCodes.INVALID_ADMIN_PARAMS)
        }

        if ( order_level === 10 && id !== target_id ) {
            if ( level ) {
                level = _.toNumber(level);
                if ( isNaN(level) || level >= 10 || level < 1 ) {
                    throw CreateError(ErrorCodes.INVALID_ADMIN_PARAMS)
                }
                admin.level = level || admin.level;
            }

            if ( sub_level ) {
                sub_level = _.toNumber(sub_level);
                if ( isNaN(sub_level) || level >= 10 || level < 0 ) {
                    throw CreateError(ErrorCodes.INVALID_ADMIN_PARAMS)
                }
                admin.sub_level = sub_level || admin.sub_level;
            }

            if ( activated ) {
                admin.activated = (activated === 'true');
            }
        }

        if ( id === target_id ) {
            admin.password = password? makePassword(password) : admin.password;
            admin.name = name || admin.name;
        }

        await admin.save()
    }
}


export default new AdminController()
