import * as _ from 'lodash';
import * as cookie from 'cookie';
import * as urlencode from 'urlencode';
import { Request, Response } from 'express';
import { IRoute, IZempieClaims } from '../_interfaces';
import { dbs, caches, docs } from '../../commons/globals';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { Transaction, Op } from 'sequelize';
import FileManager from '../../services/fileManager';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { getGameData } from '../_common';
import { isOK_channelID } from '../../commons/utils';
import { ClientSession } from 'mongoose';
import Opt from '../../../config/opt';
const { Url, CORS } = Opt;
const replaceExt = require('replace-ext');


class UserController {
    getCustomToken = async (_: any, __: any, { req, res }: any) => {
        if( !req.headers.cookie ) {
            throw CreateError(ErrorCodes.INVALID_SESSION)
        }

        if ( req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin) ) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            const { _Zid: uid } = cookie.parse(req.headers.cookie);
            const customToken = await admin.auth().createCustomToken(uid);
            return {
                customToken,
            }
        }
    }
    setCookie = async (_: any, user: DecodedIdToken, { req, res }: any) => {
        if ( req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin) ) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Headers', 'Authorization');
            res.setHeader('Set-Cookie', cookie.serialize('_Zid', user.uid, {
                domain: CORS.domain,
                path: '/',
                maxAge: 60 * 60,
                httpOnly: true,
                secure: CORS.secure,
            }));
        }
    }


    signUp = async ({ name, registration_token }: any, _user: DecodedIdToken, {req, res}: any) => {
        const record = await dbs.User.findOne({ uid: _user.uid });
        if ( record ) {
            throw CreateError(ErrorCodes.INVALID_USER_UID);
        }

        return dbs.User.getTransaction(async (transaction: Transaction) => {
            if ( !await dbs.ForbiddenWords.isOk(name || _user.name) ) {
                throw CreateError(ErrorCodes.FORBIDDEN_STRING);
            }

            const user = await dbs.User.create({
                uid: _user.uid,
                name: name || _user.name,
                channel_id: _user.uid,
                picture: _user.picture,
                provider: _user.firebase.sign_in_provider,
                email: _user.email,
                email_verified: _user.email_verified,
                fcm_token: registration_token,
            }, transaction);

            const user_id = user.id;
            const profile = await dbs.UserProfile.create({ user_id }, transaction);
            const setting = await dbs.UserSetting.create({ user_id }, transaction);

            // following 에 자신 추가 - 나중을 위해...
            await dbs.Follow.create({ user_uid: _user.uid, target_uid: _user.uid }, transaction);

            await this.setCookie(null, _user, { req, res });

            const udi = await this.getUserDetailInfo(user, profile, setting);
            return {
                user: {
                    ...udi,
                    email: user.email,
                    email_verified: user.email_verified,
                },
            }
        })
    }


    getInfo = async ({registration_token}: any, _user: DecodedIdToken, { req, res }: any) => {
        const { uid } = _user;
        let user = await caches.user.getInfo(uid);
        if ( !user ) {
            const userRecord = await dbs.User.getInfo({uid});
            if ( !userRecord ) {
                throw CreateError(ErrorCodes.INVALID_USER_UID);
            }

            await this.setCookie(null, _user, { req, res });

            const udi = await this.getUserDetailInfo(userRecord);
            user = {
                ...udi,
                email: userRecord.email,
                email_verified: userRecord.email_verified,
            };

            userRecord.last_log_in = new Date();
            userRecord.save();

            caches.user.setInfo(uid, user);
        }

        return {
            user
        }
    }


    getTargetInfoByUid = async ({target_uid}: any, {uid}: DecodedIdToken) => {
        const user = await dbs.User.getProfileByUid({ uid: target_uid });
        const target = await this.getUserDetailInfo(user);
        return {
            target,
        }
    }


    getTargetInfoByChannelId = async ({channel_id}: {channel_id: string}, _: DecodedIdToken) => {
        let channel = await caches.user.getChannel(channel_id);
        if ( !channel ) {
            // const user = await docs.User.getProfile({ channel_id });
            // if ( user ) {
            //     channel = await this.getUserDetailInfo(user);
            // }
            const user = await dbs.User.getProfileByChannelId({ channel_id });
            if ( !user ) {
                throw CreateError(ErrorCodes.INVALID_CHANNEL_ID);
            }
            channel = await this.getUserDetailInfo(user)
            // caches.user.setChannel(channel_id, channel);
        }
        return {
            target: channel
        }
    }


    private getUserDetailInfo = async (user: any, profile?: any, setting?: any) => {
        profile = profile || user.profile;
        setting = setting || user.setting;

        return {
            uid: user.uid,
            name: user.name,
            channel_id: user.channel_id,
            email: user.email,
            picture: user.picture,
            is_developer: user.is_developer,
            profile: {
                level: profile.level,
                exp: profile.exp,
                following_cnt: profile.following_cnt,
                followers_cnt: profile.followers_cnt,
                state_msg: profile.state_msg,
                description: profile.description,
                url_banner: profile.url_banner,
            },
            setting: setting? {
                theme: setting.app_theme,
                theme_extra: setting.app_theme_extra,
                language: setting.app_language,
                alarm: setting.notify_alarm,
                battle: setting.notify_battle,
                beat: setting.notify_beat,
                follow: setting.notify_follow,
                like: setting.notify_like,
                reply: setting.notify_reply,
            } : undefined,
            dev_games: user.is_developer? _.map(user.devGames, (game: any) => {
                return {
                    activated: game.activated,
                    ...getGameData(game),
                }
            }) : undefined,
            game_records: user.game_records? _.map(user.game_records, (gr: any) => {
                const game = gr.game;
                return {
                    game_id: game.id,
                    title: game.title,
                    url_thumb: game.url_thumb,
                    score: gr.score,
                }
            }) : undefined,
        }
    }


    async verifyEmail ({}, user: DecodedIdToken) {
        const userRecord = await admin.auth().getUser(user.uid)
        if ( userRecord.emailVerified ) {
            await admin.auth().updateUser(user.uid, {
                emailVerified: true,
            });
            await dbs.User.update({ email_verified: true }, { uid: user.uid });
        }
    }


    async verifyChannelId ({ channel_id }: { channel_id: string }, user: DecodedIdToken) {
        // 규칙 확인
        if ( !isOK_channelID(channel_id) ) {
            throw CreateError(ErrorCodes.INVALID_CHANNEL_ID);
        }

        // if ok
        const encoded = urlencode(channel_id)
        const dup = await dbs.User.findOne({ channel_id: encoded });
        if ( dup ) {
            throw CreateError(ErrorCodes.USER_DUPLICATED_CHANNEL_ID);
        }

        // await dbs.User.update({ channel_id }, { uid: user.uid });
    }


    setInfo = async (params: any, {uid}: DecodedIdToken, {req: {files: {file}}}: IRoute) => {
        // 불량 단어 색출
        if ( !dbs.BadWords.areOk(params) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }

        return dbs.User.getTransaction(async (transaction: Transaction) => {
            const user = await dbs.User.getInfo({ uid }, transaction);
            if ( !user ) {
                throw CreateError(ErrorCodes.INVALID_USER_UID);
            }

            const updateRequest: any = {};

            if ( user.channel_id !== params.channel_id && params.channel_id ) {
                // 규칙 확인
                if ( !isOK_channelID(params.channel_id) ) {
                    throw CreateError(ErrorCodes.INVALID_CHANNEL_ID);
                }
                user.channel_id = urlencode(params.channel_id);
            }

            if ( params.registration_token ) {
                await admin.messaging().subscribeToTopic(params.registration_token, 'broadcast-topic');
                user.fcm_token = params.registration_token;
            }

            // 이름 변경
            if ( params.name ) {
                if ( !await dbs.ForbiddenWords.isOk(params.name) ) {
                    throw CreateError(ErrorCodes.FORBIDDEN_STRING);
                }
                user.name = params.name;
                updateRequest.displayName = params.name;
            }


            let profile;
            // 상태 메시지 변경
            if ( params.state_msg ) {
                profile = await dbs.UserProfile.findOne({ user_id: user.id }, transaction);
                profile.state_msg = params.state_msg;
            }

            // 채널 설명
            if ( params.description ) {
                profile = profile || await dbs.UserProfile.findOne({ user_id: user.id }, transaction);
                profile.description = params.description;
            }

            if ( profile ) {
                await profile.save({ transaction });
            }

            let data: any;
            if ( file ) {
                const webp = await FileManager.convertToWebp(file, 80);
                // data = await FileManager.s3upload(replaceExt(/*file.name*/'profile', '.webp'), webp[0].destinationPath, uid);
                // const data: any = await FileManager.s3upload(file.name, file.path, uid);
                data = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.Rsc,
                    key: replaceExt('profile', '.webp'),
                    filePath: webp[0].destinationPath,
                    uid,
                    subDir: '/profile',
                });

                user.picture = data.Location;
                updateRequest.photoURL = data.Location;
            }
            else if ( params.rm_picture ) {
                user.picture = null;
                updateRequest.photoURL = null;
            }

            if ( Object.keys(updateRequest).length > 0 ) {
                await admin.auth().updateUser(uid, updateRequest);
            }

            // if ( params.name || data ) {
            //     await admin.auth().updateUser(uid, {
            //         displayName: params.name? params.name : undefined,
            //         photoURL: data? data.Location : undefined,
            //     })
            // }

            await user.save({ transaction });

            caches.user.delInfo(uid);
        })
    }


    setBanner = async ({}, { uid }: DecodedIdToken, {req: {files: {file}}}: IRoute) => {
        if ( !file ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS)
        }
        const user = await dbs.User.findOne({ uid });
        const webp = await FileManager.convertToWebp(file, 80);
        // const data: any = await FileManager.s3upload('banner.webp', webp[0].destinationPath, uid);
        const data: any = await FileManager.s3upload({
            bucket: Opt.AWS.Bucket.Rsc,
            key: 'banner.webp',
            filePath: webp[0].destinationPath,
            uid,
            subDir: '/channel'
        });
        await dbs.UserProfile.update({ url_banner: data.Location }, { user_id: user.id })

        caches.user.delInfo(uid);

        return {
            url_banner: data.Location
        }
    }


    signOut = async (_: any, _user: DecodedIdToken, { req, res }: any) => {
        return dbs.User.getTransaction(async (transaction: Transaction) => {
            const user = await dbs.User.getInfo({uid: _user.uid}, transaction);
            if ( user.fcm_token ) {
                await admin.messaging().unsubscribeFromTopic(user.fcm_token, 'test-topic');
                user.fcm_token = null;
                await user.save({transaction});
            }

            if ( req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin) ) {
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                res.setHeader('Set-Cookie', cookie.serialize('uid', '', {
                    domain: CORS.domain,
                    maxAge: 0,
                    httpOnly: true,
                    secure: CORS.secure,
                }));
            }
        })
    }


    updateSetting = async (params: any, {uid}: DecodedIdToken) => {
        return dbs.UserSetting.getTransaction(async (transaction: Transaction) => {
            const setting = await dbs.UserSetting.findOne({user_uid: uid}, transaction);

            if ( params.theme )  setting.app_theme = params.theme;
            if ( params.theme_extra) setting.app_theme_extra = params.theme_extra;
            if ( params.lang )   setting.app_language = params.lang;
            if ( params.alarm )  setting.notify_alarm = params.alarm;
            if ( params.battle ) setting.notify_battle = params.battle;
            if ( params.beat )   setting.notify.beat = params.beat;
            if ( params.follow ) setting.notify_follow = params.follow;
            if ( params.like )   setting.notify_like = params.like;
            if ( params.reply )  setting.notify_reply = params.reply;

            await setting.save({transaction});
        });
    }


    updateExternalLink = async (params: any, { uid }: DecodedIdToken) => {

    }


    deleteExternalLink = async ({ id }: { id: number}, { uid }: DecodedIdToken) => {
        const user = await dbs.User.findOne({ uid });
        await dbs.UserExternalLink.destroy({ user_id: user.id, id })
    }



    filterBadWord = async ({ w }: { w: string }) => {
        // 불량 단어 색출
        if ( !dbs.BadWords.isOk(w) || !await dbs.ForbiddenWords.isOk(w) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }
    }



    searchUser = async ({ search_name, limit = 100, offset = 0 }: any, {uid}: DecodedIdToken) => {
        const users = await dbs.User.search({ search_name, limit, offset });
        return {
            users: _.map(users, (user: any) => {
                return {
                    uid: user.uid,
                    name: user.name,
                    picture: user.picture,
                }
            })
        }
    }


    leaveZempie = async ({ num, text }: { num: number, text: string }, { uid }: DecodedIdToken) => {
        admin.auth().deleteUser(uid).then(async () => {
            await dbs.UserLeftLog.getTransaction(async (transaction: Transaction) => {
                await dbs.UserLeftLog.create({
                    user_uid: uid,
                    reason_num: num,
                    reason_text: text,
                }, transaction)
                await dbs.User.destroy({ uid }, transaction);
            })
        })
    }


    testMongo = async () => {
        await docs.User2.getTransaction(async (session: ClientSession) => {
            await docs.Sample.create({
                name: 'wndhrl',
                text: 'wndhrdlajrdjdtjdkgksmsep'
            }, session);
            await docs.Sample2.create({
                name: 'gpfk',
                text: 'gpfkakswlrhtlvek'
            }, session);
            // const doc = await docs.Sample.findOne({name: 'wndhrl' }, { session });
            // doc.text = 'wndhrlEkajrj'
            // doc.save({ session });
        });
    }


    testClaim = async (params: any, user: DecodedIdToken) => {
        // const claim = {
        //     zempie: {
        //         deny: {
        //             reply: {
        //                 state: true,
        //                 date: new Date(2021,0, 22),
        //                 count: 1,
        //             }
        //         }
        //     }
        // };
        //
        // if ( !user.zempie ) {
        //     await admin.auth().setCustomUserClaims(user.uid, claim);
        // }
        // else {
        //     console.log(JSON.stringify(claim))
        // }

        const userClaim = await dbs.UserClaim.findOne({user_uid: user.uid});
        const claim: IZempieClaims = JSON.parse(userClaim.data);

        claim.zempie.deny['reply'] = {
            state: true,
            date: new Date(2021, 0, 23).getTime(),
            count: claim.zempie.deny['reply'].count + 1,
        };

        userClaim.data = claim;
        userClaim.save();

        admin.auth().setCustomUserClaims(userClaim.user_uid, claim);
    }
}


export default new UserController()
