import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { dbs } from '../commons/globals';
import { IRoute } from './_interfaces';
import FileManager from '../services/fileManager';
import Opt from '../../config/opt';
const replaceExt = require('replace-ext');


interface IQnaParams {
    category: number
    title: string
    text: string
}

class SupportController {
    async askInquiry ({ category, title, text }: IQnaParams, { uid }: DecodedIdToken, {req: {files: {file}}}: IRoute) {
        if ( !title || title.length < 1 ) {
            throw CreateError(ErrorCodes.INVALID_QNA_PARAMS)
        }
        if ( !text || text.length < 5 ) {
            throw CreateError(ErrorCodes.INVALID_QNA_PARAMS)
        }

        let url_img = null;
        if ( file ) {
            const webp = await FileManager.convertToWebp(file, 80);
            const data: any = await FileManager.s3upload({
                bucket: Opt.AWS.Bucket.Rsc,
                key: replaceExt(Date.now().toString(), '.webp'),
                filePath: webp[0].destinationPath,
                uid,
                subDir: '/support/inquiries',
            });

            url_img = data.Location;
        }

        const user = await dbs.User.findOne({ uid });
        await dbs.UserInquiry.create({ user_id: user.id, category, title, text, url_img });
    }


    async getMyInquiries ({ limit = 50, offset = 0 }, { uid }: DecodedIdToken) {
        const user = await dbs.User.findOne({ uid });
        return await dbs.UserInquiry.getList({ user_id: user.id, limit, offset });
    }


    async getMyInquiry ({ id }: { id: number }, { uid }: DecodedIdToken) {
        const user = await dbs.User.findOne({ uid });
        const inquiry = await dbs.UserInquiry.model.findOne({
            where: { user_id: user.id, id },
            include: [{
                model: dbs.Admin.model,
            }]
        });
        return {
            inquiry: {
                id: inquiry.id,
                category: inquiry.category,
                title: inquiry.title,
                text: inquiry.text,
                url_img: inquiry.url_img,
                response: inquiry.response,
                created_at: inquiry.created_at,
                updated_at: inquiry.updated_at,
                admin: {
                    name: inquiry.admin? inquiry.admin.name : undefined,
                }
            }
        }
    }


    async getNotices ({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }) {
        const { count, rows } = await dbs.Notice.findAndCountAll({ activated: true }, {
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        })
        return {
            count,
            notices: _.map(rows, (row) => {
                return {
                    id: row.id,
                    category: row.category,
                    title: row.title,
                    // content: row.content,
                    created_at: row.created_at,
                }
            })
        }
    }


    async getNotice ({ id }: { id: number }) {
        const notice = await dbs.Notice.model.findOne({
            where: { id },
            attributes: {
                exclude: ['updated_at', 'deleted_at']
            }
        });
        return {
            notice: notice.get({ plain: true })
        }
    }



}


export default new SupportController()
