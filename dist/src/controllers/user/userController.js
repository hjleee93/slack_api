"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cookie = require("cookie");
const urlencode = require("urlencode");
const globals_1 = require("../../commons/globals");
const firebase_admin_1 = require("firebase-admin");
const fileManager_1 = require("../../services/fileManager");
const errorCodes_1 = require("../../commons/errorCodes");
const _common_1 = require("../_common");
const utils_1 = require("../../commons/utils");
const opt_1 = require("../../../config/opt");
const { Url, CORS } = opt_1.default;
const replaceExt = require('replace-ext');
class UserController {
    constructor() {
        this.getCustomToken = (_, __, { req, res }) => __awaiter(this, void 0, void 0, function* () {
            if (!req.headers.cookie) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_SESSION);
            }
            if (req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin)) {
                res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                res.setHeader('Access-Control-Allow-Credentials', 'true');
                const { _Zid: uid } = cookie.parse(req.headers.cookie);
                const customToken = yield firebase_admin_1.default.auth().createCustomToken(uid);
                return {
                    customToken,
                };
            }
        });
        this.setCookie = (_, user, { req, res }) => __awaiter(this, void 0, void 0, function* () {
            if (req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin)) {
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
        });
        this.signUp = ({ name, registration_token }, _user, { req, res }) => __awaiter(this, void 0, void 0, function* () {
            const record = yield globals_1.dbs.User.findOne({ uid: _user.uid });
            if (record) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_USER_UID);
            }
            return globals_1.dbs.User.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                if (!(yield globals_1.dbs.ForbiddenWords.isOk(name || _user.name))) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
                }
                const user = yield globals_1.dbs.User.create({
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
                const profile = yield globals_1.dbs.UserProfile.create({ user_id }, transaction);
                const setting = yield globals_1.dbs.UserSetting.create({ user_id }, transaction);
                // following 에 자신 추가 - 나중을 위해...
                yield globals_1.dbs.Follow.create({ user_uid: _user.uid, target_uid: _user.uid }, transaction);
                yield this.setCookie(null, _user, { req, res });
                const udi = yield this.getUserDetailInfo(user, profile, setting);
                return {
                    user: Object.assign(Object.assign({}, udi), { email: user.email, email_verified: user.email_verified }),
                };
            }));
        });
        this.getInfo = ({ registration_token }, _user, { req, res }) => __awaiter(this, void 0, void 0, function* () {
            const { uid } = _user;
            let user = yield globals_1.caches.user.getInfo(uid);
            if (!user) {
                const userRecord = yield globals_1.dbs.User.getInfo({ uid });
                if (!userRecord) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_USER_UID);
                }
                yield this.setCookie(null, _user, { req, res });
                const udi = yield this.getUserDetailInfo(userRecord);
                user = Object.assign(Object.assign({}, udi), { email: userRecord.email, email_verified: userRecord.email_verified });
                userRecord.last_log_in = new Date();
                userRecord.save();
                globals_1.caches.user.setInfo(uid, user);
            }
            return {
                user
            };
        });
        this.getTargetInfoByUid = ({ target_uid }, { uid }) => __awaiter(this, void 0, void 0, function* () {
            const user = yield globals_1.dbs.User.getProfileByUid({ uid: target_uid });
            const target = yield this.getUserDetailInfo(user);
            return {
                target,
            };
        });
        this.getTargetInfoByChannelId = ({ channel_id }, _) => __awaiter(this, void 0, void 0, function* () {
            let channel = yield globals_1.caches.user.getChannel(channel_id);
            if (!channel) {
                // const user = await docs.User.getProfile({ channel_id });
                // if ( user ) {
                //     channel = await this.getUserDetailInfo(user);
                // }
                const user = yield globals_1.dbs.User.getProfileByChannelId({ channel_id });
                if (!user) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_CHANNEL_ID);
                }
                channel = yield this.getUserDetailInfo(user);
                // caches.user.setChannel(channel_id, channel);
            }
            return {
                target: channel
            };
        });
        this.getUserDetailInfo = (user, profile, setting) => __awaiter(this, void 0, void 0, function* () {
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
                setting: setting ? {
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
                dev_games: user.is_developer ? _.map(user.devGames, (game) => {
                    return Object.assign({ activated: game.activated }, _common_1.getGameData(game));
                }) : undefined,
                game_records: user.game_records ? _.map(user.game_records, (gr) => {
                    const game = gr.game;
                    return {
                        game_id: game.id,
                        title: game.title,
                        url_thumb: game.url_thumb,
                        score: gr.score,
                    };
                }) : undefined,
            };
        });
        this.setInfo = (params, { uid }, { req: { files: { file } } }) => __awaiter(this, void 0, void 0, function* () {
            // 불량 단어 색출
            if (!globals_1.dbs.BadWords.areOk(params)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
            }
            return globals_1.dbs.User.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const user = yield globals_1.dbs.User.getInfo({ uid }, transaction);
                if (!user) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_USER_UID);
                }
                const updateRequest = {};
                if (user.channel_id !== params.channel_id && params.channel_id) {
                    // 규칙 확인
                    if (!utils_1.isOK_channelID(params.channel_id)) {
                        throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_CHANNEL_ID);
                    }
                    user.channel_id = urlencode(params.channel_id);
                }
                if (params.registration_token) {
                    yield firebase_admin_1.default.messaging().subscribeToTopic(params.registration_token, 'broadcast-topic');
                    user.fcm_token = params.registration_token;
                }
                // 이름 변경
                if (params.name) {
                    if (!(yield globals_1.dbs.ForbiddenWords.isOk(params.name))) {
                        throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
                    }
                    user.name = params.name;
                    updateRequest.displayName = params.name;
                }
                let profile;
                // 상태 메시지 변경
                if (params.state_msg) {
                    profile = yield globals_1.dbs.UserProfile.findOne({ user_id: user.id }, transaction);
                    profile.state_msg = params.state_msg;
                }
                // 채널 설명
                if (params.description) {
                    profile = profile || (yield globals_1.dbs.UserProfile.findOne({ user_id: user.id }, transaction));
                    profile.description = params.description;
                }
                if (profile) {
                    yield profile.save({ transaction });
                }
                let data;
                if (file) {
                    const webp = yield fileManager_1.default.convertToWebp(file, 80);
                    // data = await FileManager.s3upload(replaceExt(/*file.name*/'profile', '.webp'), webp[0].destinationPath, uid);
                    // const data: any = await FileManager.s3upload(file.name, file.path, uid);
                    data = yield fileManager_1.default.s3upload({
                        bucket: opt_1.default.AWS.Bucket.Rsc,
                        key: replaceExt('profile', '.webp'),
                        filePath: webp[0].destinationPath,
                        uid,
                        subDir: '/profile',
                    });
                    user.picture = data.Location;
                    updateRequest.photoURL = data.Location;
                }
                else if (params.rm_picture) {
                    user.picture = null;
                    updateRequest.photoURL = null;
                }
                if (Object.keys(updateRequest).length > 0) {
                    yield firebase_admin_1.default.auth().updateUser(uid, updateRequest);
                }
                // if ( params.name || data ) {
                //     await admin.auth().updateUser(uid, {
                //         displayName: params.name? params.name : undefined,
                //         photoURL: data? data.Location : undefined,
                //     })
                // }
                yield user.save({ transaction });
                globals_1.caches.user.delInfo(uid);
            }));
        });
        this.setBanner = ({}, { uid }, { req: { files: { file } } }) => __awaiter(this, void 0, void 0, function* () {
            if (!file) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PARAMS);
            }
            const user = yield globals_1.dbs.User.findOne({ uid });
            const webp = yield fileManager_1.default.convertToWebp(file, 80);
            // const data: any = await FileManager.s3upload('banner.webp', webp[0].destinationPath, uid);
            const data = yield fileManager_1.default.s3upload({
                bucket: opt_1.default.AWS.Bucket.Rsc,
                key: 'banner.webp',
                filePath: webp[0].destinationPath,
                uid,
                subDir: '/channel'
            });
            yield globals_1.dbs.UserProfile.update({ url_banner: data.Location }, { user_id: user.id });
            globals_1.caches.user.delInfo(uid);
            return {
                url_banner: data.Location
            };
        });
        this.signOut = (_, _user, { req, res }) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.User.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const user = yield globals_1.dbs.User.getInfo({ uid: _user.uid }, transaction);
                if (user.fcm_token) {
                    yield firebase_admin_1.default.messaging().unsubscribeFromTopic(user.fcm_token, 'test-topic');
                    user.fcm_token = null;
                    yield user.save({ transaction });
                }
                if (req.headers.origin && CORS.allowedOrigin.includes(req.headers.origin)) {
                    res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Set-Cookie', cookie.serialize('uid', '', {
                        domain: CORS.domain,
                        maxAge: 0,
                        httpOnly: true,
                        secure: CORS.secure,
                    }));
                }
            }));
        });
        this.updateSetting = (params, { uid }) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.UserSetting.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const setting = yield globals_1.dbs.UserSetting.findOne({ user_uid: uid }, transaction);
                if (params.theme)
                    setting.app_theme = params.theme;
                if (params.theme_extra)
                    setting.app_theme_extra = params.theme_extra;
                if (params.lang)
                    setting.app_language = params.lang;
                if (params.alarm)
                    setting.notify_alarm = params.alarm;
                if (params.battle)
                    setting.notify_battle = params.battle;
                if (params.beat)
                    setting.notify.beat = params.beat;
                if (params.follow)
                    setting.notify_follow = params.follow;
                if (params.like)
                    setting.notify_like = params.like;
                if (params.reply)
                    setting.notify_reply = params.reply;
                yield setting.save({ transaction });
            }));
        });
        this.updateExternalLink = (params, { uid }) => __awaiter(this, void 0, void 0, function* () {
        });
        this.deleteExternalLink = ({ id }, { uid }) => __awaiter(this, void 0, void 0, function* () {
            const user = yield globals_1.dbs.User.findOne({ uid });
            yield globals_1.dbs.UserExternalLink.destroy({ user_id: user.id, id });
        });
        this.filterBadWord = ({ w }) => __awaiter(this, void 0, void 0, function* () {
            // 불량 단어 색출
            if (!globals_1.dbs.BadWords.isOk(w) || !(yield globals_1.dbs.ForbiddenWords.isOk(w))) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
            }
        });
        this.searchUser = ({ search_name, limit = 100, offset = 0 }, { uid }) => __awaiter(this, void 0, void 0, function* () {
            const users = yield globals_1.dbs.User.search({ search_name, limit, offset });
            return {
                users: _.map(users, (user) => {
                    return {
                        uid: user.uid,
                        name: user.name,
                        picture: user.picture,
                    };
                })
            };
        });
        this.leaveZempie = ({ num, text }, { uid }) => __awaiter(this, void 0, void 0, function* () {
            firebase_admin_1.default.auth().deleteUser(uid).then(() => __awaiter(this, void 0, void 0, function* () {
                yield globals_1.dbs.UserLeftLog.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                    yield globals_1.dbs.UserLeftLog.create({
                        user_uid: uid,
                        reason_num: num,
                        reason_text: text,
                    }, transaction);
                    yield globals_1.dbs.User.destroy({ uid }, transaction);
                }));
            }));
        });
        this.testMongo = () => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.docs.User2.getTransaction((session) => __awaiter(this, void 0, void 0, function* () {
                yield globals_1.docs.Sample.create({
                    name: 'wndhrl',
                    text: 'wndhrdlajrdjdtjdkgksmsep'
                }, session);
                yield globals_1.docs.Sample2.create({
                    name: 'gpfk',
                    text: 'gpfkakswlrhtlvek'
                }, session);
                // const doc = await docs.Sample.findOne({name: 'wndhrl' }, { session });
                // doc.text = 'wndhrlEkajrj'
                // doc.save({ session });
            }));
        });
        this.testClaim = (params, user) => __awaiter(this, void 0, void 0, function* () {
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
            const userClaim = yield globals_1.dbs.UserClaim.findOne({ user_uid: user.uid });
            const claim = JSON.parse(userClaim.data);
            claim.zempie.deny['reply'] = {
                state: true,
                date: new Date(2021, 0, 23).getTime(),
                count: claim.zempie.deny['reply'].count + 1,
            };
            userClaim.data = claim;
            userClaim.save();
            firebase_admin_1.default.auth().setCustomUserClaims(userClaim.user_uid, claim);
        });
    }
    verifyEmail({}, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRecord = yield firebase_admin_1.default.auth().getUser(user.uid);
            if (userRecord.emailVerified) {
                yield firebase_admin_1.default.auth().updateUser(user.uid, {
                    emailVerified: true,
                });
                yield globals_1.dbs.User.update({ email_verified: true }, { uid: user.uid });
            }
        });
    }
    verifyChannelId({ channel_id }, user) {
        return __awaiter(this, void 0, void 0, function* () {
            // 규칙 확인
            if (!utils_1.isOK_channelID(channel_id)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_CHANNEL_ID);
            }
            // if ok
            const encoded = urlencode(channel_id);
            const dup = yield globals_1.dbs.User.findOne({ channel_id: encoded });
            if (dup) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.USER_DUPLICATED_CHANNEL_ID);
            }
            // await dbs.User.update({ channel_id }, { uid: user.uid });
        });
    }
}
exports.default = new UserController();
//# sourceMappingURL=userController.js.map