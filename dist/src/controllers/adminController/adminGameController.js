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
const globals_1 = require("../../commons/globals");
const sequelize_1 = require("sequelize");
const utils_1 = require("../../commons/utils");
const errorCodes_1 = require("../../commons/errorCodes");
const enums_1 = require("../../commons/enums");
class AdminGameController {
    constructor() {
        this.getGames = ({ limit = 50, offset = 0, sort = 'id', dir = 'asc', category = 0, title = '' }) => __awaiter(this, void 0, void 0, function* () {
            const { rows, count } = yield globals_1.dbs.Game.findAndCountAll({}, {
                include: [{
                        model: globals_1.dbs.User.model,
                    }],
                where: {
                    category,
                    url_game: {
                        [sequelize_1.Op.ne]: null
                    },
                    title: {
                        [sequelize_1.Op.like]: `%${title}%`
                    }
                },
                order: [[sort, dir]],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            });
            return {
                count,
                games: _.map(rows, (game) => game.get({ plain: true })),
            };
        });
        this.createAffiliatedGame = ({ pathname, title, description, hashtags, url_game, url_thumb, url_thumb_webp, url_thumb_gif }) => __awaiter(this, void 0, void 0, function* () {
            const exist = yield globals_1.dbs.Game.findOne({ pathname });
            if (exist) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.ADMIN_GAME_PATHNAME_DUPLICATED);
            }
            return globals_1.dbs.Game.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const game = yield globals_1.dbs.Game.create({
                    category: enums_1.eGameCategory.Affiliated,
                    pathname,
                    title, description,
                    hashtags,
                    url_game, url_thumb, url_thumb_webp, url_thumb_gif,
                }, transaction);
                yield globals_1.dbs.Hashtag.addTags(game.id, hashtags, transaction);
                return {
                    game: game.get({ plain: true }),
                };
            }));
        });
        this.updateAffiliatedGame = ({ game_id, pathname, title, description, hashtags, url_game, url_thumb, url_thumb_webp, url_thumb_gif }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Game.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const game = yield globals_1.dbs.Game.findOne({ id: game_id, category: enums_1.eGameCategory.Affiliated }, transaction);
                if (!game) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_GAME_ID);
                }
                game.pathname = pathname || game.pathname;
                game.title = title || game.title;
                game.description = description || game.description;
                game.url_game = url_game || game.url_game;
                game.url_thumb = url_thumb || game.url_thumb;
                game.url_thumb_webp = url_thumb_webp || game.url_thumb_webp;
                game.url_thumb_gif = url_thumb_gif || game.url_thumb_gif;
                yield game.save({ transaction });
                if (hashtags) {
                    yield globals_1.dbs.Hashtag.delTags(game.id, 'game', transaction);
                    yield globals_1.dbs.Hashtag.addTags(game.id, game.hashtags, transaction);
                }
            }));
        });
        this.deleteAffiliatedGame = ({ game_id }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Game.destroy({ id: game_id });
        });
        this.updateGame = (params) => __awaiter(this, void 0, void 0, function* () {
            // 불량 단어 색출
            if (!globals_1.dbs.BadWords.areOk(params)) {
                throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.FORBIDDEN_STRING);
            }
            const { game_id, official, category, enabled, activated } = params;
            yield globals_1.dbs.Game.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const game = yield globals_1.dbs.Game.findOne({ id: game_id }, transaction);
                if (!!category) {
                    game.category = _.toNumber(category);
                }
                // if ( !!official ) {
                //     game.official = parseBoolean(official);
                // }
                if (!!enabled) {
                    game.enabled = utils_1.parseBoolean(enabled);
                }
                if (!!activated) {
                    game.activated = utils_1.parseBoolean(activated);
                }
                yield game.save({ transaction });
            }));
        });
    }
}
exports.default = new AdminGameController();
//# sourceMappingURL=adminGameController.js.map