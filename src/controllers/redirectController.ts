import { Response, Request } from 'express';
import { IRoute } from './_interfaces';
import { caches, dbs } from '../commons/globals';
import { CreateError } from '../commons/errorCodes';
import { getGameData } from './_common';
import cfgOption from '../../config/opt';
const { Url } = cfgOption;


class RedirectController {
    private checkUserAgent = (req: Request) => {
        const userAgent: any = req.headers['User-Agent'.toLowerCase()];
        return userAgent?.match(/GuzzleHttp|baiduspider|twitterbot|facebookexternalhit|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i)
    }

    private responseGame = (res: Response, game: any, url: string) => {
        res.status(200).set('Content-Type', 'text/html')
            .end(`<html>
                                <head>
                                    <title>${game.title}</title>
                                    <meta name="description" content="${game.description}">
                                    <meta property="og:url" content="${url}">
                                    <meta property="og:site_name" content="Zempie">
                                    <meta property="og:title" content="${game.title}">
                                    <meta property="og:description" content="${game.description}">
                                    <meta property="og:image" content="${game.url_thumb}">
                                    <meta property="og:type" content="website">
                                </head>
                            </html>`);
    }


    site = async (req: Request, res: Response) => {
        if ( this.checkUserAgent(req) ) {
            res.redirect(Url.Host);
        }
        else {
            res.redirect(`${Url.Redirect}/${req.params.url}`)
        }
    }

    play = async (req: Request, res: Response) => {
        const { pathname } = req.params;
        if ( this.checkUserAgent(req) ) {
            let game = await caches.game.getByPathname(pathname);
            if ( !game ) {
                game = await dbs.Game.findOne({ pathname: pathname });
            }
            if ( !game ) {
                res.redirect(Url.Host);
            }
            else {
                game = getGameData(game);
                caches.game.setByPathname(game, pathname);
                this.responseGame(res, game, `${Url.Host}/play/${req.params.pathname}`);
            }
        }
        else {
            res.redirect(`${Url.Redirect}/play/${req.params.pathname}`)
        }
    }


    battle = async (req: Request, res: Response) => {
        const { battle_uid } = req.params;
        const keyType = `zempie:redirect:`;
        if ( this.checkUserAgent(req) ) {
            let game = await caches.game.getData(keyType, battle_uid);
            if ( !game ) {
                const record = await dbs.Battle.model.findOne({
                    where: { uid: battle_uid },
                    include: [{
                        model: dbs.Game.model,
                    }]
                });
                if ( !record ) {
                    res.redirect(Url.Host);
                    return;
                }
                game = getGameData(record.game)
                caches.game.setData(game, keyType, battle_uid);
            }
            this.responseGame(res, game, `${Url.Launcher}/battle/${battle_uid}`);
        }
        else {
            res.redirect(`${Url.LauncherRedirect}/battle/${battle_uid}`)
        }
    }

    shared = async (req: Request, res: Response) => {
        const { shared_uid } = req.params;
        const keyType = `zempie:redirect:`;
        if ( this.checkUserAgent(req) ) {
            let game = await caches.game.getData(keyType, shared_uid);
            if ( !game ) {
                const record = await dbs.SharedGame.model.findOne({
                    where: { uid: shared_uid },
                    include: [{
                        model: dbs.Game.model,
                    }]
                });
                if ( !record ) {
                    res.redirect(Url.Host);
                    return;
                }
                game = getGameData(record.game)
                caches.game.setData(game, keyType, shared_uid);
            }
            this.responseGame(res, game, `${Url.Launcher}/shared/${shared_uid}`);
        }
        else {
            res.redirect(`${Url.LauncherRedirect}/shared/${shared_uid}`)
        }
    }


    game = async (req: Request, res: Response) => {
        const { pathname } = req.params;
        if ( this.checkUserAgent(req) ) {
            let game = await caches.game.getByPathname(pathname);
            if ( !game ) {
                game = await dbs.Game.findOne({ pathname: pathname });
            }
            if ( !game ) {
                res.redirect(Url.Host);
            }
            else {
                game = getGameData(game);
                caches.game.setByPathname(game, pathname);
                this.responseGame(res, game, `${Url.Launcher}/game/${req.params.pathname}`);
            }
        }
        else {
            res.redirect(`${Url.LauncherRedirect}/game/${req.params.pathname}`)
        }
    }
}


export default new RedirectController()
