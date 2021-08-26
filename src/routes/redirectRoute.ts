import { Router } from 'express';
import convert from '../controllers/_convert';
import RedirectController from '../controllers/redirectController';

export default (router: Router) => {
    router.get(`/redirect/site/:url`, RedirectController.site);
    router.get(`/redirect/play/:pathname`, RedirectController.play);
    router.get(`/redirect/battle/:battle_uid`, RedirectController.battle);
    router.get(`/redirect/shared/:shared_uid`, RedirectController.shared);
    router.get(`/redirect/game/:pathname`, RedirectController.game);

    // router.get('/test-php', ((req, res) => {
    //     res.send({state: 'good', name: 'raptor'})
    // }))
    // router.post('/test-php', ((req, res) => {
    //     const token = req.body;
    //     res.send({token})
    // }))
}
