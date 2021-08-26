import * as _ from 'lodash';
import { SrvMQ } from './_srvMQ';
import { dbs } from '../../commons/globals';
import { Sequelize, Transaction } from 'sequelize';


class ApiMQ extends SrvMQ {
    private interval: NodeJS.Timeout;
    private game_emotion: {
        [game_id: number]: {
            [e_id: string]: boolean,
        }} = {};
    private game_ids: {
        [game_id: number]: {
            count_start: number,
            count_over: number,
            count_heart: number,
        }} = {};
    private game_replies: {
        [reply_id: number]: {
            count_good: number,
            count_bad: number,
            count_reply: number,
        }} = {};
    private game_logs: {
        user_uid: string,
        game_id: number,
        score: number,
        playtime: number,
    }[] = [];


    constructor() {
        super();

        this.interval = setInterval(async () => {
            await this.processBulk();
        }, 1000 * 10);
    }

    private processBulk = async () =>{
        dbs.GameLog.bulkCreate(this.game_logs);
        this.game_logs = [];

        // 게임 오버 카운팅
        _.forEach(this.game_ids, async (obj: any, id: any) => {
            if ( obj.count_start !== 0 || obj.count_over !== 0 || obj.count_heart !== 0 ) {
                dbs.Game.update({
                    count_start: Sequelize.literal(`count_start + ${obj.count_start}`),
                    count_over: Sequelize.literal(`count_over + ${obj.count_over}`),
                    count_heart: Sequelize.literal(`count_heart + ${obj.count_heart}`),
                }, { id });
                obj.count_start = 0;
                obj.count_over = 0;
                obj.count_heart = 0;
            }
        })

        // 게임 감정표현
        _.forEach(this.game_emotion, async (obj: any, id: any) => {
            if ( _.some(obj, v => v != 0) ) {
                await dbs.GameEmotion.getTransaction(async (transaction: Transaction) => {
                    let gameEmotion = await dbs.GameEmotion.findOne({ game_id: id }, transaction);
                    if ( !gameEmotion ) {
                        gameEmotion = await dbs.GameEmotion.create({ game_id: id }, transaction);
                    }
                    for ( let e in obj ) {
                        if ( obj.hasOwnProperty(e) ) {
                            gameEmotion[e] += obj[e];
                            obj[e] = 0;
                        }
                    }
                    await gameEmotion.save({ transaction });
                })
            }
        })


        // 댓글 리액션
        _.forEach(this.game_replies, async (obj: any, id: any) => {
            if ( obj.count_good !== 0 || obj.count_bad !== 0 || obj.count_reply !== 0 ) {
                dbs.GameReply.update({
                    count_good: Sequelize.literal(`count_good + ${obj.count_good}`),
                    count_bad: Sequelize.literal(`count_bad + ${obj.count_bad}`),
                    count_reply: Sequelize.literal(`count_reply + ${obj.count_reply}`),
                }, { id });
                obj.count_good = 0;
                obj.count_bad = 0;
                obj.count_reply = 0;
                delete this.game_replies[id];
            }
        })
    }


    private getGameIds = (id: number) => {
        return this.game_ids[id] = this.game_ids[id] || {
            count_start: 0,
            count_over: 0,
            count_heart: 0,
        }
    }
    private getGameEmotions = (id: number) => {
        return this.game_emotion[id] = this.game_emotion[id] || {
            e1: 0,
            e2: 0,
            e3: 0,
            e4: 0,
            e5: 0,
        }
    }
    private getGameReply = (id: number) => {
        return this.game_replies[id] = this.game_replies[id] || {
            count_good: 0,
            count_bad: 0,
            count_reply: 0,
        }
    }


    async gameLoaded (message: string) {
        const { user_uid, game_id }: any = JSON.parse(message);

        const game = this.getGameIds(game_id);
        game.count_start += 1;
    }


    async gameOver(message: string) {
        const { user_uid, game_id, score, playtime }: any = JSON.parse(message);
        this.game_logs.push({ user_uid, game_id, score, playtime });

        const game = this.getGameIds(game_id);
        game.count_over += 1;
    }


    async gameHeart(message: string) {
        const { game_id, activated }: any = JSON.parse(message);
        const game: any = this.getGameIds(game_id);
        game.count_heart += activated? 1 : -1;
    }


    async gameEmotion(message: string) {
        const { game_id, e_id, activated }: any = JSON.parse(message);
        const game: any = this.getGameEmotions(game_id);
        game[e_id] += activated? 1 : -1;
    }

    async gameReply(message: string) {
        const { reply_id, data }: any = JSON.parse(message);
        const reply: any = this.getGameReply(reply_id);
        reply.count_good += data?.good || 0;
        reply.count_bad += data?.bad || 0;
        reply.count_reply += data?.reply || 0;
    }
}


export default new ApiMQ()
