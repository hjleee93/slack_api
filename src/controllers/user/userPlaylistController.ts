import * as _ from 'lodash';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import * as uniqid from 'uniqid';
import { caches, dbs } from '../../commons/globals';
import { CreateError, ErrorCodes } from '../../commons/errorCodes';
import { getGameData } from '../_common';
import { IRoute } from '../_interfaces';
import FileManager from '../../services/fileManager';
import { Transaction } from 'sequelize';
import Opt from '../../../config/opt';
const replaceExt = require('replace-ext');


interface IPlaylistParams {
    uid: string
    title?: string
}

class UserPlaylistController {
    getPlaylists = async (params: IPlaylistParams, user: DecodedIdToken) => {
        const user_uid = params.uid || user.uid;
        const records = await dbs.UserPlaylist.findAll({ user_uid }, {
            include: [{
                model: dbs.User.model,
            }]
        });
        return {
            playlists: _.map(records, (record: any) => {
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
                }
            })
        }
    }


    getPlaylist = async ({ uid }: IPlaylistParams, _user: DecodedIdToken) => {
        let ret = await caches.playlist.getOne(uid);
        if ( !ret ) {
            const playlist = await dbs.UserPlaylist.getPlaylist({ uid });
            if ( !playlist ) {
                throw CreateError(ErrorCodes.INVALID_PLAYLIST_UID);
            }

            const indexes = JSON.parse(playlist.indexes);
            const indexedGames: any = [];
            _.forEach(indexes, (i) => {
                const obj = _.find(playlist.games, (g: any) => g.game_id === i);
                indexedGames.push(getGameData(obj.game));
            })

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
            }

            caches.playlist.setOne(uid, ret);
        }

        return ret;
    }


    createPlaylist = async ({ title }: IPlaylistParams, user: DecodedIdToken, {req:{files:{file}}}: IRoute) => {
        if ( !title ) {
            throw CreateError(ErrorCodes.INVALID_PARAMS);
        }
        // 불량 단어 색출
        if ( !dbs.BadWords.isOk(title) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }

        let data: any;
        const playlist_uid = uniqid();
        if ( file ) {
            const webp = await FileManager.convertToWebp(file, 80);
            data = await FileManager.s3upload({
                bucket: Opt.AWS.Bucket.Rsc,
                key: replaceExt(`playlist_${playlist_uid}`, '.webp'),
                filePath: webp[0].destinationPath,
                uid: user.uid,
                subDir: 'playlist'
            })
        }

        const playlist = await dbs.UserPlaylist.create({
            uid: playlist_uid,
            user_uid: user.uid,
            title,
            url_bg: data? data.Location : null,
            indexes: [],
        });

        return {
            playlist: {
                uid: playlist.uid,
                title: playlist.title,
                url_bg: playlist.url_bg,
                updated_at: playlist.updated_at,
            }
        }
    }


    updatePlaylist = async ({ uid, title }: IPlaylistParams, user: DecodedIdToken, {req:{files:{file}}}: IRoute) => {
        // 불량 단어 색출
        if ( !!title && !dbs.BadWords.isOk(title) ) {
            throw CreateError(ErrorCodes.FORBIDDEN_STRING);
        }

        await dbs.UserPlaylist.getTransaction(async (transaction: Transaction) => {
            const playlist = await dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
            if ( !playlist ) {
                throw CreateError(ErrorCodes.INVALID_PLAYLIST_UID);
            }

            let data: any;
            if ( file ) {
                const webp = await FileManager.convertToWebp(file, 80);
                data = await FileManager.s3upload({
                    bucket: Opt.AWS.Bucket.Rsc,
                    key: replaceExt(`playlist_${uid}`, '.webp'),
                    filePath: webp[0].destinationPath,
                    uid: user.uid,
                    subDir: '/playlist',
                });
            }

            playlist.title = title || playlist.title;
            playlist.url_bg = data? data.Location : playlist.url_bg;
            await playlist.save({ transaction });

            caches.playlist.delOne(uid);

            return {
                playlist: {
                    uid,
                    title: playlist.title,
                    url_bg: playlist.url_bg,
                    updated_at: playlist.updated_at,
                }
            }
        })
    }

    deletePlaylist = async ({ uid }: IPlaylistParams, user: DecodedIdToken) => {
        caches.playlist.delOne(uid);
        await dbs.UserPlaylist.destroy({ uid, user_uid: user.uid });
    }


    /**
     * game in a playlist
     */
    addGame = async ({ uid, game_id }: any, user: DecodedIdToken) => {
        game_id = _.toNumber(game_id);
        await dbs.UserPlaylist.getTransaction(async (transaction: Transaction) => {
            const playlist = await dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
            if ( !playlist ) {
                throw CreateError(ErrorCodes.INVALID_PLAYLIST_UID);
            }

            const game = await dbs.Game.findOne({ id: game_id });
            if ( !game ) {
                throw CreateError(ErrorCodes.INVALID_GAME_ID);
            }

            const arr = JSON.parse(playlist.indexes);
            const i = _.indexOf(arr, game_id);
            if ( i !== -1 ) {
                throw CreateError(ErrorCodes.PLAYLIST_DUPLICATED_GAME);
            }

            await dbs.UserPlaylistGame.create({
                user_playlist_id: playlist.id,
                game_id: game.id,
            }, transaction);

            arr.push(game_id);
            playlist.indexes = arr;
            await playlist.save({ transaction });

            caches.playlist.delOne(uid);
        });
    }

    delGame = async ({ uid, game_id }: any, user: DecodedIdToken) => {
        game_id = _.toNumber(game_id);
        await dbs.UserPlaylist.getTransaction(async (transaction: Transaction) => {
            const playlist = await dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
            if ( !playlist ) {
                throw CreateError(ErrorCodes.INVALID_PLAYLIST_UID);
            }

            const arr = JSON.parse(playlist.indexes);
            _.pull(arr, game_id);
            playlist.indexes = arr;
            await playlist.save({ transaction });

            await dbs.UserPlaylistGame.destroy({ user_playlist_id: playlist.id, game_id }, transaction);
            caches.playlist.delOne(uid);
        })
    }

    sortGame = async ({ uid, indexes }: any, user: DecodedIdToken) => {
        await dbs.UserPlaylist.getTransaction(async (transaction: Transaction) => {
            const playlist = await dbs.UserPlaylist.findOne({ uid, user_uid: user.uid }, transaction);
            if ( !playlist ) {
                throw CreateError(ErrorCodes.INVALID_PLAYLIST_UID);
            }

            try {
                const _indexes = JSON.parse(indexes);
                if ( typeof _indexes === 'object' ) {
                    playlist.indexes = _indexes;
                    await playlist.save({ transaction });
                    caches.playlist.delOne(uid);
                }
            }
            catch (e) {
                throw CreateError(ErrorCodes.INVALID_PARAMS);
            }
        })


    }
}


export default new UserPlaylistController()
