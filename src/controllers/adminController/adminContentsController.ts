import * as _ from 'lodash';
import { IAdmin, IZempieClaims } from '../_interfaces';
import { dbs } from '../../commons/globals';
import admin from 'firebase-admin';
import { Transaction } from 'sequelize';
import { eMailCategory, eProjectState, eProjectVersionState } from '../../commons/enums';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';



interface IPunishParams {
    game_id: number
    permanent: boolean

    user_id: number
    deny_name: string
    is_deny: boolean
    date: Date
}
class AdminContentsController {
    punishGame = async ({ game_id, project_version_id, permanent, title, content }: any) => {
        await dbs.Game.getTransaction(async (transaction: Transaction) => {
            // make the game disabled
            const game = await dbs.Game.findOne({ id: game_id });
            game.enabled = false;
            await game.save({ transaction });

            const project = await dbs.Project.findOne({ game_id });
            if ( permanent ) {
                project.state = eProjectState.PermanentBan;
                project.deploy_version_id = null;
                await project.save({ transaction });

                const prv = await dbs.ProjectVersion.findOne({ project_id: project.id, state: 'deploy' }, transaction);
                if ( prv ) {
                    prv.state = 'passed';
                    await prv.save({ transaction });
                }
            }
            else if ( project_version_id ) {
                const prv = await dbs.ProjectVersion.findOne({ id: project_version_id, project_id: project.id });
                if ( prv.state !== 'passed' && prv.state !== 'deploy' ) {
                    // version.state |= eProjectVersionState.Ban;
                    throw CreateError(ErrorCodes.INVALID_PROJECT_VERSION_STATE);
                }
                if ( prv.state === 'deploy' ) {
                    project.deploy_version_id = null;
                    await project.save({ transaction });
                }
                prv.state = 'ban';
                await prv.save({ transaction });
            }
            else {
                throw CreateError(ErrorCodes.INVALID_PARAMS);
            }

            const developer = await dbs.User.findOne({ id: game.user_id });

            // send a mail
            await dbs.UserMailbox.create({
                user_uid: developer.uid,
                category: eMailCategory.Normal,
                title,
                content,
            }, transaction)
        })
    }


    punishUser = async ({ user_id, category, reason, date }: any) => {
        const user = await dbs.User.findOne({ id: user_id });
        const userClaim = await dbs.UserClaim.getZempieClaim(user_id, user.uid);
        const claim: IZempieClaims = JSON.parse(userClaim.data);

        claim.zempie.deny[category] = {
            state: true,
            date: new Date(date).getTime(),
            count: claim.zempie.deny[category]?.count + 1 || 1,
        };

        userClaim.data = claim;
        userClaim.save();

        await admin.auth().setCustomUserClaims(userClaim.user_uid, claim);

        await dbs.UserPunished.create({
            user_id,
            is_denied: true,
            category,
            reason,
            end_at: new Date(date),
        });

        // send a mail
        await dbs.UserMailbox.create({
            user_uid: user.uid,
            category: eMailCategory.Normal,
            title: '정지 안내',
            content: `이용 정지 되었습니다.`,
        });
    }

    releasePunishedGame = async ({ project_id, project_version_id }: any) => {
        if ( project_version_id ) {
            await dbs.ProjectVersion.getTransaction(async (transaction: Transaction) => {
                const prv = await dbs.ProjectVersion.findOne({ id: project_version_id }, transaction);
                // prv.state ^= eProjectVersionState.Ban;
                prv.state = 'passed';
                await prv.save({ transaction });

                // send a mail
                const prj = await dbs.Project.findOne({ id: prv.project_id });
                const developer = await dbs.User.findOne({ id: prj.user_id });
                await dbs.UserMailbox.create({
                    user_uid: developer.uid,
                    category: eMailCategory.Normal,
                    title: '정지 해제 안내',
                    content: `정지되었던 ${prj.name} 프로젝트 버젼이 정상화되었습니다.`,
                }, transaction)
            })
        }
        if ( project_id ) {
            await dbs.Project.getTransaction(async (transaction: Transaction) => {
                const prj = await dbs.Project.findOne({ id: project_id }, transaction);
                // prj.state ^= eProjectState.PermanentBan;
                prj.state = eProjectState.Normal;
                await prj.save({ transaction });

                // send a mail
                const developer = await dbs.User.findOne({ id: prj.user_id });
                await dbs.UserMailbox.create({
                    user_uid: developer.uid,
                    category: eMailCategory.Normal,
                    title: '정지 해제 안내',
                    content: `정지되었던 ${prj.name} 프로젝트가 정상화되었습니다.`,
                }, transaction)
            })
        }
    }

    releasePunishedUser = async ({ id }: any) => {
        await dbs.UserPunished.getTransaction(async (transaction: Transaction) => {
            const record = await dbs.UserPunished.findOne({ id }, transaction);
            record.is_denied = false;
            await record.save({ transaction });

            const userClaim = await dbs.UserClaim.findOne({ user_id: record.user_id }, transaction);
            const claim: IZempieClaims = JSON.parse(userClaim.data);
            claim.zempie.deny[record.category].state = false;
            userClaim.data = claim;
            await userClaim.save({ transaction });

            await admin.auth().setCustomUserClaims(userClaim.user_uid, claim);
        });
    }

    punishedUserList = async ({ user_id, limit = 50, offset = 0, sort = 'id', dir = 'asc' }: any) => {
        const records = await dbs.UserPunished.model.findAll({
            where: { user_id },
            attributes: ['id', 'is_denied', 'category', 'reason', 'end_at', 'created_at'],
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        });
        return _.map(records, (d: any) => d.get({ plain: true }))
    }
}


export default new AdminContentsController()
