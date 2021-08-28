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
const uniqid = require("uniqid");
const globals_1 = require("../../commons/globals");
const errorCodes_1 = require("../../commons/errorCodes");
const _common_1 = require("../_common");
const fileManager_1 = require("../../services/fileManager");
const opt_1 = require("../../../config/opt");
const replaceExt = require('replace-ext');
class UserPlaylistController {
    constructor() {
        this.getPlaylists = (params, user) => __awaiter(this, void 0, void 0, function* () {
            const user_uid = params.uid || user.uid;
            const records = yield globals_1.dbs.UserPlaylist.findAll({ user_uid }, {
                include: [{
                        model: globals_1.dbs.User.model,
                    }]
            });
            return {
                playlists: _.map(records, (record) => {
                    const { user } = record;
                    return {
                        uid: record.uid,
                        title: record.title,
                        url_bg: record.url_bg,
                        user: {
                            uid: user.uid,
                            name: user.name,
                            picture: user.picture,
                            channel_id: user.channel_id,
                        }
                    };
                })
            };
        });
        this.getPlaylist = ({ uid }, _user) => __awaiter(this, void 0, void 0, function* () {
            let ret = yield globals_1.caches.playlist.getOne(uid);
            if (!ret) {
                const playlist = yield globals_1.dbs.UserPlaylist.getPlaylist({ uid });
                if (!playlist) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PLAYLIST_UID);
                }
                const indexes = JSON.parse(playlist.indexes);
                const indexedGames = [];
                _.forEach(indexes, (i) => {
                    const obj = _.find(playlist.games, (g) => g.game_id === i);
                    indexedGames.push(_common_1.getGameData(obj.game));
                });
                const { user } = playlist;
                ret = {
                    uid: playlist.uid,
                    title: playlist.title,
                    url_bg: playlist.url_bg,
                    user: {
                        uid: user.uid,
                        name: user.name,
                        picture: user.picture,
                        channel_id: user.channel_id,
                    },
                    games: indexedGames,
                };
                globals_1.caches.playlist.setOne(uid, ret);
            }
            return ret;
        });
        this.createPlaylist = ({ title }, user, { req: { files: { file } } }) => __awaiter(this, void 0, void 0, function* () {
            if (!title) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PARAMS);
            }
            // 불량 단어 색출
            if (!globals_1.dbs.BadWords.isOk(title)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
            }
            let data;
            const playlist_uid = uniqid();
            if (file) {
                const webp = yield fileManager_1.default.convertToWebp(file, 80);
                data = yield fileManager_1.default.s3upload({
                    bucket: opt_1.default.AWS.Bucket.Rsc,
                    key: replaceExt(`playlist_${playlist_uid}`, '.webp'),
                    filePath: webp[0].destinationPath,
                    uid: user.uid,
                    subDir: 'playlist'
                });
            }
            const playlist = yield globals_1.dbs.UserPlaylist.create({
                uid: playlist_uid,
                user_uid: user.uid,
                title,
                url_bg: data ? data.Location : null,
                indexes: [],
            });
            return {
                playlist: {
                    uid: playlist.uid,
                    title: playlist.title,
                    url_bg: playlist.url_bg,
                    updated_at: playlist.updated_at,
                }
            };
        });
        this.updatePlaylist = ({ uid, title }, user, { req: { files: { file } } }) => __awaiter(this, void 0, void 0, function* () {
            // 불량 단어 색출
            if (!!title && !globals_1.dbs.BadWords.isOk(title)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
            }
            yield globals_1.dbs.UserPlaylist.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const playlist = yield globals_1.dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
                if (!playlist) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PLAYLIST_UID);
                }
                let data;
                if (file) {
                    const webp = yield fileManager_1.default.convertToWebp(file, 80);
                    data = yield fileManager_1.default.s3upload({
                        bucket: opt_1.default.AWS.Bucket.Rsc,
                        key: replaceExt(`playlist_${uid}`, '.webp'),
                        filePath: webp[0].destinationPath,
                        uid: user.uid,
                        subDir: '/playlist',
                    });
                }
                playlist.title = title || playlist.title;
                playlist.url_bg = data ? data.Location : playlist.url_bg;
                yield playlist.save({ transaction });
                globals_1.caches.playlist.delOne(uid);
                return {
                    playlist: {
                        uid,
                        title: playlist.title,
                        url_bg: playlist.url_bg,
                        updated_at: playlist.updated_at,
                    }
                };
            }));
        });
        this.deletePlaylist = ({ uid }, user) => __awaiter(this, void 0, void 0, function* () {
            globals_1.caches.playlist.delOne(uid);
            yield globals_1.dbs.UserPlaylist.destroy({ uid, user_uid: user.uid });
        });
        /**
         * game in a playlist
         */
        this.addGame = ({ uid, game_id }, user) => __awaiter(this, void 0, void 0, function* () {
            game_id = _.toNumber(game_id);
            yield globals_1.dbs.UserPlaylist.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const playlist = yield globals_1.dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
                if (!playlist) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PLAYLIST_UID);
                }
                const game = yield globals_1.dbs.Game.findOne({ id: game_id });
                if (!game) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_GAME_ID);
                }
                const arr = JSON.parse(playlist.indexes);
                const i = _.indexOf(arr, game_id);
                if (i !== -1) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.PLAYLIST_DUPLICATED_GAME);
                }
                yield globals_1.dbs.UserPlaylistGame.create({
                    user_playlist_id: playlist.id,
                    game_id: game.id,
                }, transaction);
                arr.push(game_id);
                playlist.indexes = arr;
                yield playlist.save({ transaction });
                globals_1.caches.playlist.delOne(uid);
            }));
        });
        this.delGame = ({ uid, game_id }, user) => __awaiter(this, void 0, void 0, function* () {
            game_id = _.toNumber(game_id);
            yield globals_1.dbs.UserPlaylist.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const playlist = yield globals_1.dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
                if (!playlist) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PLAYLIST_UID);
                }
                const arr = JSON.parse(playlist.indexes);
                _.pull(arr, game_id);
                playlist.indexes = arr;
                yield playlist.save({ transaction });
                yield globals_1.dbs.UserPlaylistGame.destroy({ user_playlist_id: playlist.id, game_id }, transaction);
                globals_1.caches.playlist.delOne(uid);
            }));
        });
        this.sortGame = ({ uid, indexes }, user) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.UserPlaylist.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const playlist = yield globals_1.dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
                if (!playlist) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PLAYLIST_UID);
                }
                try {
                    const _indexes = JSON.parse(indexes);
                    if (typeof _indexes === 'object') {
                        playlist.indexes = _indexes;
                        yield playlist.save({ transaction });
                        globals_1.caches.playlist.delOne(uid);
                    }
                }
                catch (e) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PARAMS);
                }
            }));
        });
    }
}
exports.default = new UserPlaylistController();
//# sourceMappingURL=userPlaylistController.js.map