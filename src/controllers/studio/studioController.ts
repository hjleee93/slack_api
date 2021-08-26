import * as _ from 'lodash';
import { IRoute, IZempieClaims } from '../_interfaces';
import { dbs, caches } from '../../commons/globals';
import {Transaction} from "sequelize";
import {CreateError, ErrorCodes} from "../../commons/errorCodes";
import FileManager from "../../services/fileManager";
import { v4 as uuid } from 'uuid';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import * as path from "path";
import Opt from '../../../config/opt';
import { eProjectState } from '../../commons/enums';

const replaceExt = require('replace-ext');

// const ERROR_STUDIO = {
//     NOT_FIND_USER : {
//         code: 2001,
//         message: '유저 정보를 찾을 수 없습니다.'
//     },
//     NOT_FIND_DEVELOPER : {
//         code: 2002,
//         message: '개발자 정보를 찾을 수 없습니다.'
//     },
//     ALREADY_EXIST_GAME_PATH : {
//         code: 2101,
//         message: '이미 존재하는 게임 경로 입니다.'
//     },
//     INVALID_VERSION_FILE : {
//         code: 2102,
//         message: '업로드된 게임 파일이 없습니다.'
//     },
//     INVALID_PROJECT_ID : {
//         code: 2103,
//         message: '프로젝트'
//     },
//     ACTIVE_VERSION : {
//         code : 2104,
//         message: '사용중인 버전 입니다.',
//     },
//     ALREADY_EXIST_UPDATE_VERSION : {
//         code : 2105,
//         message: '이미 등록된 버전이 있습니다.',
//     },
// }

interface ICreateProject extends IVersion, IProject {

}

interface IProject {
    name : string,
    user_id? : number,
    description? : string,
    picture? : string,
    picture2? : string,
    pathname : string,
    hashtags? : string,
    size? : number,
}

interface IVersion {
    project_id? : number,
    game_id? : number,
    startFile? : string,
    description? : string,
    version_description? : string,
    version? : string,
    url? : string,
    number? : number,
    state? : string,
    autoDeploy? : boolean,
    size? : number,
}

class StudioController {
    signupDeveloper = async  (params: any, {uid}: DecodedIdToken) =>{
        return dbs.User.getTransaction( async (transaction : Transaction)=>{
            //권한 추가

            const user = await dbs.User.findOne({uid}, transaction);
            user.is_developer = true;
            await user.save({transaction});

            const userClaim = await dbs.UserClaim.getZempieClaim(user.id, user.uid);
            const claim: IZempieClaims = JSON.parse(userClaim.data);
            claim.zempie.is_developer = true;
            userClaim.data = claim;
            await userClaim.save({ transaction });
            await admin.auth().setCustomUserClaims(userClaim.user_uid, claim);

            return {
                success : true
            };
        })
    }

    getProjects = async ( params : any, {uid}: DecodedIdToken )=>{
        const user = await dbs.User.findOne( { uid } );
        if( !user ) {
            //등록된 개발자 찾을수 없음
            throw CreateError(ErrorCodes.INVALID_DEVELOPER_ID);
        }

        return await dbs.Project.getProjects( { user_id : user.id } );
    }

    getProjects2 = async (params: any, { uid }: DecodedIdToken) => {
        const user = await dbs.User.findOne({ uid });
        if ( !user || !user.is_developer ) {
            throw CreateError(ErrorCodes.INVALID_DEVELOPER_ID);
        }

        return await dbs.Project.model.findAll({
            where: { user_id: user.id },
            include: [{
                model: dbs.Game.model,
            }]
        })
    }

    getProject = async ( params : any, { uid }: DecodedIdToken )=>{
        if( !params.id ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        const user = await dbs.User.findOne({ uid });

        const prj = await dbs.Project.getProject( { id : params.id, user_id: user.id } );
        if ( !prj || prj.state !== eProjectState.Normal ) {
            throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_ID);
        }
        return prj;
    }

    verifyGamePathname = async ( params : any, { uid }: DecodedIdToken ) => {
        const path = await dbs.Game.findOne( {
            pathname : params.pathname
        } );

        let success = true;

        if( path ) {
            success = false;
            // throw CreateError(ErrorCodes.ALREADY_EXIST_GAME_PATH)
        }

        return {
            success,
        }
    }


    createProject = async ( params : ICreateProject, {uid}: DecodedIdToken, {req:{files}}: IRoute) => {
        // 불량 단어 색출
        if ( !dbs.BadWords.areOk(params) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }
        // 금지 단어 색출
        if ( !!params.name && !await dbs.ForbiddenWords.isOk(params.name) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }


        return dbs.Project.getTransaction( async (transaction : Transaction)=>{
            // const dev = await dbs.Developer.findOne( {user_uid : uid} );
            // params.developer_id = dev.id;

            const user = await dbs.User.findOne( { uid } );
            params.user_id = user.id;

            const picFile = files && files[ 'project_picture' ] || undefined;
            files[ 'project_picture' ] = undefined;

            const picFile2 = files && files[ 'project_picture2' ] || undefined;
            files[ 'project_picture2' ] = undefined;



            params.hashtags = params.hashtags || '';
            const project = await dbs.Project.create( params, transaction );

            if( picFile ) {

                const webp = await FileManager.convertToWebp(picFile, 80, false);

                const data: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    // key : file2.name,
                    key : replaceExt( 'thumb', path.extname(picFile.name) ),
                    filePath : picFile.path,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });

                const data2: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    key : replaceExt('thumb', '.webp'),
                    filePath : webp[0].destinationPath,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });


                project.picture = data.Location;
                project.picture_webp = data2.Location;
            }

            if( picFile2 ) {
                const data: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    key : replaceExt( 'thumb2', path.extname(picFile2.name) ),
                    filePath : picFile2.path,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });
                project.picture2 = data.Location;
            }

            const game = await dbs.Game.create( {
                // uid : uuid(),
                activated : 0,
                enabled : 0,
                user_id : user.id,
                pathname : params.pathname,
                title : project.name,
                description : project.description,
                hashtags : project.hashtags,
                // version : version.version,
                // url_game : version.url,
                url_thumb : project.picture,
                url_thumb_webp : project.picture_webp,
                url_thumb_gif : project.picture2,
            }, transaction );
            project.game_id = game.id;

            const versionParams : IVersion = {};

            versionParams.project_id = project.id;
            versionParams.game_id = game.id;
            versionParams.number = 1;
            versionParams.autoDeploy = params.autoDeploy || true;
            versionParams.version = params.version || '1.0.0';
            versionParams.startFile = params.startFile || '';
            versionParams.size = params.size || 0;
            versionParams.description = params.version_description || '';


            const versionFiles = files;
            if( versionFiles && versionParams.startFile ) {
                const subDir = `/project/${project.id}/${uuid()}`;
                versionParams.url = await uploadVersionFile( versionFiles, uid, subDir, versionParams.startFile );
                versionParams.state = 'process';
            }

            const version = await dbs.ProjectVersion.create( versionParams, transaction );
            project.update_version_id = version.id;



            return await project.save({transaction});
        })
    }

    deleteProject = async ( params : any, {uid}: DecodedIdToken ) => {
        if( !params.id ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }

        const user = await dbs.User.findOne({ uid });

        return dbs.Project.getTransaction( async (transaction : Transaction) => {
            const project = await dbs.Project.findOne( {id : params.id, user_id: user.id } );
            if ( !project ) {
                throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_ID);
            }

            const versions = await dbs.ProjectVersion.findAll( { project_id : params.id } );
            for( let i = 0; i < versions.length; i++ ) {
                await dbs.ProjectVersion.destroy( { id : versions[i].id }, transaction );
            }
            const game = await dbs.Game.findOne({ id: project.game_id }, transaction);
            game.activated = false;
            game.enabled = false;
            game.pathname = `d_${game.pathname}`;
            game.url_game = null;
            game.deleted_at = new Date();
            await game.save({ transaction });
            // await dbs.Game.destroy({ id : project.game_id }, transaction );
            return await dbs.Project.destroy( { id : params.id }, transaction );
        });
    }

    /*
    project와 연관있는 game 필드
     description, version, title
     url_game, url_thumb, url_title
     activated
     */
    updateProject = async ( params : any, { uid }: DecodedIdToken, {req: {files: {file, file2}}}: IRoute)=>{
        // 불량 단어 색출
        if ( !dbs.BadWords.areOk(params) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }
        // 금지 단어 색출
        if ( !!params.name && !await dbs.ForbiddenWords.isOk(params.name) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }

        const user = await dbs.User.findOne({ uid });

        return dbs.Project.getTransaction( async (transaction : Transaction) => {
            const project = await dbs.Project.findOne( { id : params.id, user_id: user.id } );
            if ( !project || project.state !== eProjectState.Normal ) {
                throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_ID);
            }

            if ( !!project.deploy_version_id ) {
                const prv = await dbs.ProjectVersion.findOne({ id: project.deploy_version_id, project_id: project.id });
                if ( !prv ) {
                    throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_ID);
                }
                else if ( prv.state === 'ban' ) {
                    throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_VERSION_ID);
                }
            }

            const game = await dbs.Game.findOne( {
                id : project.game_id,
            } );

            if ( file ) {
                const webp = await FileManager.convertToWebp(file, 80, false);

                const data: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    // key : file.name,
                    key : replaceExt( 'thumb', path.extname(file.name) ),
                    filePath : file.path,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });


                const data2: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    key : replaceExt('thumb', '.webp'),
                    filePath : webp[0].destinationPath,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });


                params.picture = data.Location;
                game.url_thumb = params.picture;

                params.picture_webp = data2.Location;
                game.url_thumb_webp = params.picture_webp;
            }

            if ( file2 ) {
                const data: any = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.RscPublic,
                    // key : file2.name,
                    key : replaceExt( 'thumb2', path.extname(file2.name) ),
                    filePath : file2.path,
                    uid,
                    subDir: `/project/${project.id}/thumb`
                });
                params.picture2 = data.Location;
                game.url_thumb_gif = params.picture2;
            }

            if( params.description ) {
                game.description = params.description;
            }

            if( params.name ) {
                game.title = params.name;
            }

            if( params.hashtags ) {
                game.hashtags = params.hashtags;
            }

            if( parseInt(params.deploy_version_id) === 0 ) {
                if( project.deploy_version_id ) {
                    const preDeployVersion = await dbs.ProjectVersion.findOne(  {
                        id : project.deploy_version_id
                    }, transaction );
                    preDeployVersion.state = 'passed';
                    await preDeployVersion.save({transaction});
                }

                game.activated = false;
                game.enabled = false;
                game.url_game = null;
                params.deploy_version_id = null;
            }
            else if( params.deploy_version_id ) {
                if( project.deploy_version_id ) {
                    const preDeployVersion = await dbs.ProjectVersion.findOne(  {
                        id : project.deploy_version_id
                    }, transaction );
                    preDeployVersion.state = 'passed';
                    await preDeployVersion.save({transaction});
                }

                if( project.update_version_id === params.deploy_version_id ) {
                    params.update_version_id = null;
                }

                const deployVersion = await dbs.ProjectVersion.findOne( {
                    id : params.deploy_version_id
                },transaction );
                deployVersion.state = 'deploy';
                await deployVersion.save({transaction});

                game.version = deployVersion.version;
                game.activated = true;
                game.enabled = true;
                game.url_game = deployVersion.url;
            }

            if( params.stage ) {
                game.stage = params.stage;
            }

            await game.save({transaction});
            return await dbs.Project.updateProject( params, transaction );
        })
    }

    createVersion = async ( params : any, { uid }: DecodedIdToken, {req: {files}}: IRoute ) => {
        const project_id = params.project_id;
        const user = await dbs.User.findOne({ uid });

        // const data: any = await FileManager.s3upload(replaceExt(file.name, '.webp'), webp[0].destinationPath, uid);
        return dbs.ProjectVersion.getTransaction( async (transaction : Transaction)=>{

            const project = await dbs.Project.findOne( { id : project_id, user_id: user.id }, transaction );
            if( project.update_version_id ) {
                const preUpdateVersion = await dbs.ProjectVersion.findOne( { id : project.update_version_id }, transaction );
                if( preUpdateVersion.state !== 'fail' && preUpdateVersion.state !== 'passed' ) {
                    throw CreateError(ErrorCodes.ALREADY_EXIST_UPDATE_VERSION);
                }
            }

            const result = await dbs.ProjectVersion.findAndCountAll( {
                project_id
            } );
            let maxNum = 0;
            if(result.rows.length) {
                const lastVersion = result.rows[ result.rows.length - 1 ];
                maxNum = lastVersion.number;
            }

            const subDir = `/project/${project_id}/${uuid()}`;
            const url = await uploadVersionFile( files, uid, subDir, params.startFile );
            params.number = maxNum + 1;
            params.state = 'process';
            params.url = url;
            params.game_id = project.game_id;

            const version = await dbs.ProjectVersion.create( params, transaction );
            project.update_version_id = version.id;
            await project.save({transaction});
            return version;
        })
    }

    // getVersions = async  ( params : any, {uid}: DecodedIdToken )=>{
    //     return await dbs.ProjectVersion.findAll( {
    //         project_id : params.project_id
    //     } )
    // }

    // getVersion = async  ( params : any, {uid}: DecodedIdToken )=>{
    //     return await dbs.ProjectVersion.findOne( {
    //         id : params.id
    //     } );
    // }

    deleteVersion = async  ( params : any, { uid }: DecodedIdToken )=>{
        const user = await dbs.User.findOne({ uid });

        return dbs.ProjectVersion.getTransaction( async (transaction : Transaction)=>{
            const version = await dbs.ProjectVersion.findOne( { id : params.id } );
            const project = await dbs.Project.findOne( { id : version.project_id, user_id: user.id }, transaction );
            if ( !project ) {
                throw CreateError(ErrorCodes.INVALID_ACCESS_PROJECT_ID);
            }

            if( project.update_version_id === version.id ) {
                project.update_version_id = null;
            }

            if( project.deploy_version_id === version.id ) {
                throw CreateError(ErrorCodes.ACTIVE_VERSION);
            }

            await project.save({transaction});
            return await dbs.ProjectVersion.destroy( {
                id : params.id
            } );
        })


    }

    // updateVersion = async  ( params : any, {uid}: DecodedIdToken )=>{
    //     return dbs.ProjectVersion.getTransaction( async (transaction : Transaction)=>{
    //         return await dbs.ProjectVersion.updateVersion( params, transaction );
    //     });
    // }

    getCurrentSurveyResult = async (params: any, _user: DecodedIdToken) => {
        const ret: any = {
            survey_url: null,
            done: false,
        };

        const user = await dbs.User.findOne({ uid: _user.uid });
        const project = await dbs.Project.findOne({ user_id: user.id });
        if ( !project ) {
            return ret;
        }

        const currentSurvey = await dbs.Survey.currentSurvey();
        if ( currentSurvey ) {
            const record = await dbs.SurveyResult.findOne({
                user_uid: _user.uid,
                survey_id: currentSurvey.id
            });
            ret.done = !!record;
            ret.survey_url = currentSurvey?.form_url;
        }
        return ret;
    }
    callbackSurvey = async ({ formId: form_id, results }: any, user: any, {req}: IRoute) => {
        let user_uid = '';
        const u = _.some(results, (r: any) => {
            if ( r.type.toUpperCase() === 'TEXT' && r.title.toLowerCase().includes('uid') ) {
                user_uid = r.response;
                return true;
            }
            return false;
        });

        if ( u ) {
            const user = await dbs.User.findOne({ uid: user_uid });
            if ( !user ) {
                throw CreateError(ErrorCodes.INVALID_SURVEY_USER_UID);
            }
            const survey = await dbs.Survey.findOne({ form_id });
            if ( !survey ) {
                throw CreateError(ErrorCodes.INVALID_SURVEY_FORM_ID);
            }
            await dbs.SurveyResult.create({ user_uid, survey_id: survey.id });
        }
    }
}


export default new StudioController();

class Version {

    major : number = 0;
    minor : number = 0;
    patch : number = 0;

    constructor( ver : string = '' ) {
        if( ver ) {
            const split = ver.split('.');
            if( split.length >= 3 ) {
                this.major = Number(split[0]);
                this.minor = Number(split[1]);
                this.patch = Number(split[2]);
            }
        }
    }

    nextPatch() {
        return `${this.major}.${this.minor}.${this.patch + 1}`;
    }

    toString() : string {
        return `${this.major}.${this.minor}.${this.patch}`;
    }

}

async function uploadVersionFile( files : any, uid : string, subDir : string, startFile : string ) : Promise<string> {

    let url = '';
    for( let key in files ) {
        const file = files[key];
        if( file ) {
            const data = await FileManager.s3upload( {
                bucket: Opt.AWS.Bucket.Rsc,
                key : file.name,
                filePath : file.path,
                uid,
                subDir,
            }) as any;

            if( file.name === startFile ) {
                url = data.Location;
            }
        }
    }

    return new Promise(function (resolve) {
        resolve(url);
    });
}
