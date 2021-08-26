import {dbs} from "../../commons/globals";
import {Transaction} from "sequelize";
import {IAdmin} from "../_interfaces";
import { eMailCategory } from '../../commons/enums';
import * as _ from 'lodash';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { parseBoolean } from '../../commons/utils';


class AdminStudioController {
    getVersions = async  ( params : any, admin: IAdmin )=>{
        return await dbs.ProjectVersion.findAll(  { state : 'process' }, {
            include : [{
                model: dbs.Project.model,
            }]
        });
    }

    getVersion = async ({ version_id } : any, admin: IAdmin ) => {
        const version = await dbs.ProjectVersion.findOne( {
            id : version_id
        });
        const project = await dbs.Project.findOne( {
            id : version.project_id
        });
        // const developer = await dbs.Developer.findOne( {
        //     id : project.developer_id
        // });

        return  {
            version,
            project,
            // developer
        }
    }

    setVersion = async ( params : any, admin: IAdmin )=>{
        return dbs.ProjectVersion.getTransaction( async (transaction : Transaction)=>{
            if( params.state === 'passed' ) {
                const version = await dbs.ProjectVersion.findOne( { id : params.id } );
                // params.id = version.id;

                if( version.autoDeploy ) {
                    const project = await dbs.Project.findOne( { id : version.project_id }, transaction );
                    const game = await dbs.Game.findOne( { id : project.game_id }, transaction );

                    game.activated = true;
                    game.enabled = true;
                    game.version = version.version;
                    game.url_game = version.url;
                    params.state = 'deploy';

                    if( project.deploy_version_id ) {
                        const preDeployVersion = await dbs.ProjectVersion.findOne( { id : project.deploy_version_id }, transaction );
                        preDeployVersion.state = 'passed';
                        await preDeployVersion.save({transaction});
                    }
                    project.deploy_version_id = version.id;

                    if( project.update_version_id === version.id ) {
                        project.update_version_id = null;
                    }

                    await project.save( {transaction} );
                    await game.save( {transaction} );

                    const developer = await dbs.User.findOne({ id: game.user_id });
                    await dbs.UserMailbox.create({
                        user_uid: developer.uid,
                        category: eMailCategory.AllowProjectVersion,
                        title: '심사 승인 통과',
                        content: `배포 대기 중입니다.`,
                    }, transaction);
                }

            }

            if ( params.user_id ) {
                const developer = await dbs.User.findOne({ id: params.user_id });
                await dbs.UserMailbox.create({
                    user_uid: developer.uid,
                    category: eMailCategory.BanProjectVersion,
                    title: '심사 승인 거절',
                    content: `${params.reason}`,
                }, transaction);
            }
            return await dbs.ProjectVersion.updateVersion( params, transaction );
        })
    }


    // 설문조사
    getSurveys = async ({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }) => {
        const records = await dbs.Survey.findAll({}, {
            order: [[sort, dir]],
            limit: _.toNumber(limit),
            offset: _.toNumber(offset),
        });

        return {
            surveys: _.map(records, (r: any) => {
                return {
                    id: r.id,
                    activated: r.activated,
                    form_id: r.form_id,
                    start_at: new Date(r.start_at),
                    end_at: new Date(r.end_at),
                }
            })
        }
    }

    createSurvey = async ({ form_id, form_url, start_at, end_at }: any) => {
        await dbs.Survey.create({
            form_id,
            form_url,
            start_at: new Date(start_at),
            end_at: new Date(end_at),
        })
    }
    updateSurvey = async ({ id, activated, form_id, start_at, end_at }: any) => {
        await dbs.Survey.getTransaction(async (transaction: Transaction) => {
            const record = await dbs.Survey.findOne({ id }, transaction);
            if ( !record ) {
                throw CreateError(ErrorCodes.INVALID_SURVEY_ID);
            }
            if ( !!activated ) {
                record.activated = parseBoolean(activated);
            }
            if ( form_id ) {
                record.form_id = form_id;
            }
            if ( start_at ) {
                record.start_at = new Date(start_at);
            }
            if ( end_at ) {
                record.end_at = new Date(end_at);
            }
            await record.save({ transaction });
        })
    }
    deleteSurvey = async ({ id }: any) => {
        await dbs.Survey.destroy({ id });
    }
}

export default new AdminStudioController();
