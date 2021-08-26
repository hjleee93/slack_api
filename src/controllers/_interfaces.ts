import { NextFunction, Request, Response } from 'express';
import { eAlarm, eNotice, eNotify, eTimeline } from "../commons/enums";

/**
 * json-rpc
 */
export interface IRpcError {
    code: number,
    message: string,
    data: any
}
export interface IRpcMethod {
    auth: boolean,
    method: Function,
    is_admin: boolean,
}
export interface IRpcBody {
    jsonrpc: string,
    method: string,
    params: any,
    id: string,
}


/**
 * decoded
 */
export interface IDecoded {
    uid: string,
}
export interface IAdmin extends IDecoded {
    id: number,
    uid: string,
    name : string,
    level: number,
    sub_level: number,
}
export interface IPublisher extends IDecoded {
    domain: string,
}


/**
 * decoded idToken + zempie claims
 */
export interface IZempieClaims {
    zempie: {
        is_developer: boolean,
        deny: {
            [key: string]: {
                state: boolean,
                date: number,
                count: number
            },
        },

        [key: string]: any
    }
}



/**
 * parameters
 */
export interface IRoute {
    req: Request,
    res: Response,
    next: NextFunction
}
export interface ISocialMedia {
    user_uid: string,
    target_uid: string,
}

export interface IGameParams {
    game_id: number,
    user_uid: string,
    score: number,
    limit: number,
    offset: number,
    pid?: string,   // publishing_id
}
export interface IGamePlayParams {
    pathname: string,
    user_uid: string,
    score?: number,
}
export interface IGameListParams {
    limit: number,
    offset: number,
    sort: string,
    dir: string,
    official?: string,
    category?: number,
}

export interface IS3Upload {
    bucket: string,
    key: string,
    filePath: string,
    uid: string,
    subDir: string,
}


export interface ITimelineParams {
    uid?: string,
    user_id?: number,
    game_id?: number,
    user_uid?: string,
    // game_uid?: string,
    limit?: number,
    offset?: number,
    type?: eTimeline,
    score?: number,
    follower_ids?: Array<number>,
    achievement_id?: number,
    battle_id?: number,
}

export interface INotifyParams {
    user_uid: string,
    type: eNotify,
    data?: { [key: string]: string };
}
export interface INotify {
    topic?: string,
    token?: string,
    title?: string,
    body?: string,
    imageUrl?: string,
    data?: { [key: string]: string };
}

export interface INoticeParams {
    id: number,
    category: eNotice,
    title: string,
    content: string,
    img_link: string,
    start_at: Date,
    end_at: Date,
}

export interface IAlarmParams {
    user_uid?: string,
    target_uid?: string,
    game_id?: number,
    type?: eAlarm,
    extra?: Object,
    limit: number,
    offset: number
}

export interface IBattleParams {
    battle_uid: string,
    battle_key?: string,
    period?: string,
    is_infinity?: boolean,
    score?: number,
}
export interface IBattlePlayParams {
    battle_key: string,
    battle_uid?: string,
    name?: string,
    score: number,
}
export interface IGameKey {
    uid: string,
    user_uid: string,
    secret_id: number,
    end_at?: Date
}
