import { Router } from 'express';
import convert from '../controllers/_convert';
import { isAuthenticated, validateFirebaseIdToken } from './_common';
import GameController from '../controllers/game/gameController';
import GameContentController from '../controllers/game/gameContentController';
import BattleController from '../controllers/battleController';
import RankingController from '../controllers/rankingController';


const apiVer = `/api/v1`;

export default (router: Router) => {
    router.get(`${apiVer}/featured`,            validateFirebaseIdToken,    convert(GameController.featuredList));

    // 게임 하르 ❤
    router.post(`${apiVer}/game/heart`,         validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.heart));

    // 게임 감정 표현
    router.post(`${apiVer}/game/emotion`,       validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.emotion));

    // 도전 게임 - 평가 리포트
    router.get(`${apiVer}/game/ch-report`,      validateFirebaseIdToken,    convert(GameContentController.getReports));
    router.post(`${apiVer}/game/ch-report`,     validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.createOrUpdateChallengingReport));

    // 게임 하르 ❤
    router.post(`${apiVer}/game/heart`,         validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.heart));

    // 게임 감정 표현
    router.post(`${apiVer}/game/emotion`,       validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.emotion));

    // 게임 댓글
    router.get(`${apiVer}/game/reply`,              validateFirebaseIdToken,    convert(GameContentController.getReplies));
    router.get(`${apiVer}/game/rereply`,            validateFirebaseIdToken,    convert(GameContentController.getReReplies));
    router.post(`${apiVer}/game/reply`,             validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.leaveReply));
    router.post(`${apiVer}/game/reply/reaction`,    validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.reactReply));

    // 도전 게임 - 평가 리포트
    router.get(`${apiVer}/game/ch-report`,      validateFirebaseIdToken,    convert(GameContentController.getReports));
    router.post(`${apiVer}/game/ch-report`,     validateFirebaseIdToken,    isAuthenticated,    convert(GameContentController.createOrUpdateChallengingReport));



    router.get(`/game/:pathname/:pid`,          convert(GameController.playGame, true),    convert(GameController.redirectGame));
    router.get(`${apiVer}/game/:pathname`,      validateFirebaseIdToken,    convert(GameController.getGame));
    router.get(`${apiVer}/games`,               validateFirebaseIdToken,    convert(GameController.getGameList));
    router.get(`${apiVer}/games/hashtags/:tag`, validateFirebaseIdToken,    convert(GameController.getHashTags));
    router.get(`${apiVer}/games/tagged/:id`,    validateFirebaseIdToken,    convert(GameController.getHashTagById));
    router.get(`${apiVer}/games/s/:tag`,        validateFirebaseIdToken,    convert(GameController.getGameListByHashtag));
    router.get(`${apiVer}/games/ranking/g`,     validateFirebaseIdToken,    convert(RankingController.getGlobalRanking));
    router.get(`${apiVer}/games/ranking/f`,     validateFirebaseIdToken,    convert(RankingController.getFollowingRanking));


    // for testing
    router.get(`${apiVer}/sample-test`,         convert(GameController.sampleTest));
    router.get(`${apiVer}/cache-test`,          convert(GameController.cacheTest));
    router.get(`${apiVer}/cache-test2`,         convert(GameController.cacheTest2));

    router.post(`${apiVer}/test-badword`,       convert(GameController.tagTest));
    router.get(`${apiVer}/tag-test/search`,     convert(GameController.tagTest2));


    // deprecated
    router.post(`${apiVer}/game/start`,         validateFirebaseIdToken,    convert(GameController.gameStart));
    router.post(`${apiVer}/game/over`,          validateFirebaseIdToken,    convert(GameController.gameOver));
    router.get(`${apiVer}/battles/`,            validateFirebaseIdToken,    convert(BattleController.getBattleList));
    router.get(`${apiVer}/battle/battle_id`,    convert(BattleController.getInfo));
    router.post(`${apiVer}/battle/host`,        convert(BattleController.hostBattle));
    router.post(`${apiVer}/battle/start`,       convert(BattleController.gameStart));
    router.post(`${apiVer}/battle/over`,        convert(BattleController.gameOver));
}
