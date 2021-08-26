import * as uniqid from 'uniqid';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { dbs } from '../commons/globals';
import { eReportType } from '../commons/enums';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import FileManager from '../services/fileManager';
import Opt from '../../config/opt';
import { IRoute } from './_interfaces';
const replaceExt = require('replace-ext');


interface IReportParams {
    target_type: number,
    target_id: number,
    reason_num: number | number[],
    reason: string,
}
class ContentController {
    reportGame = async ({target_type, target_id, reason_num, reason}: IReportParams, user: DecodedIdToken, {req:{files:{file}}}: IRoute) => {
        if ( !target_id || !reason_num ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        let data: any;
        if ( file ) {
            const webp = await FileManager.convertToWebp(file, 80);
            data = await FileManager.s3upload({
                bucket: Opt.AWS.Bucket.Rsc,
                key: replaceExt(uniqid(), '.webp'),
                filePath: webp[0].destinationPath,
                uid: user.uid,
                subDir: '/report-game',
            })
        }

        const userRecord = await dbs.User.findOne({ uid: user.uid });
        await dbs.UserReport.create({
            user_id: userRecord.id,
            target_type: eReportType.Game,
            target_id,
            reason_num: reason_num.toString(),
            reason,
            url_img: data?.Location,
        })

    }

    reportUser = async ({target_type, target_id, reason_num, reason}: IReportParams, user: DecodedIdToken, {req:{files:{file}}}: IRoute) => {
        if ( !target_id || !reason_num ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        let data: any;
        if ( file ) {
            const webp = await FileManager.convertToWebp(file, 80);
            data = await FileManager.s3upload({
                bucket: Opt.AWS.Bucket.Rsc,
                key: replaceExt(uniqid(), '.webp'),
                filePath: webp[0].destinationPath,
                uid: user.uid,
                subDir: '/report-user',
            })
        }

        const userRecord = await dbs.User.findOne({ uid: user.uid });
        await dbs.UserReport.create({
            user_id: userRecord.id,
            target_type: eReportType.User,
            target_id,
            reason_num: reason_num.toString(),
            reason,
            url_img: data?.Location,
        })

    }
}


export default new ContentController()
