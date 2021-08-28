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
const firebase_admin_1 = require("firebase-admin");
const enums_1 = require("../../commons/enums");
const errorCodes_1 = require("../../commons/errorCodes");
class AdminContentsController {
    constructor() {
        this.punishGame = ({ game_id, project_version_id, permanent, title, content }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Game.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                // make the game disabled
                const game = yield globals_1.dbs.Game.findOne({ id: game_id });
                game.enabled = false;
                yield game.save({ transaction });
                const project = yield globals_1.dbs.Project.findOne({ game_id });
                if (permanent) {
                    project.state = enums_1.eProjectState.PermanentBan;
                    project.deploy_version_id = null;
                    yield project.save({ transaction });
                    const prv = yield globals_1.dbs.ProjectVersion.findOne({ project_id: project.id, state: 'deploy' }, transaction);
                    if (prv) {
                        prv.state = 'passed';
                        yield prv.save({ transaction });
                    }
                }
                else if (project_version_id) {
                    const prv = yield globals_1.dbs.ProjectVersion.findOne({ id: project_version_id, project_id: project.id });
                    if (prv.state !== 'passed' && prv.state !== 'deploy') {
                        // version.state |= eProjectVersionState.Ban;
                        throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PROJECT_VERSION_STATE);
                    }
                    if (prv.state === 'deploy') {
                        project.deploy_version_id = null;
                        yield project.save({ transaction });
                    }
                    prv.state = 'ban';
                    yield prv.save({ transaction });
                }
                else {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_PARAMS);
                }
                const developer = yield globals_1.dbs.User.findOne({ id: game.user_id });
                // send a mail
                yield globals_1.dbs.UserMailbox.create({
                    user_uid: developer.uid,
                    category: enums_1.eMailCategory.Normal,
                    title,
                    content,
                }, transaction);
            }));
        });
        this.punishUser = ({ user_id, category, reason, date }) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield globals_1.dbs.User.findOne({ id: user_id });
            const userClaim = yield globals_1.dbs.UserClaim.getZempieClaim(user_id, user.uid);
            const claim = JSON.parse(userClaim.data);
            claim.zempie.deny[category] = {
                state: true,
                date: new Date(date).getTime(),
                count: ((_a = claim.zempie.deny[category]) === null || _a === void 0 ? void 0 : _a.count) + 1 || 1,
            };
            userClaim.data = claim;
            userClaim.save();
            yield firebase_admin_1.default.auth().setCustomUserClaims(userClaim.user_uid, claim);
            yield globals_1.dbs.UserPunished.create({
                user_id,
                is_denied: true,
                category,
                reason,
                end_at: new Date(date),
            });
            // send a mail
            yield globals_1.dbs.UserMailbox.create({
                user_uid: user.uid,
                category: enums_1.eMailCategory.Normal,
                title: '정지 안내',
                content: `이용 정지 되었습니다.`,
            });
        });
        this.releasePunishedGame = ({ project_id, project_version_id }) => __awaiter(this, void 0, void 0, function* () {
            if (project_version_id) {
                yield globals_1.dbs.ProjectVersion.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                    const prv = yield globals_1.dbs.ProjectVersion.findOne({ id: project_version_id }, transaction);
                    // prv.state ^= eProjectVersionState.Ban;
                    prv.state = 'passed';
                    yield prv.save({ transaction });
                    // send a mail
                    const prj = yield globals_1.dbs.Project.findOne({ id: prv.project_id });
                    const developer = yield globals_1.dbs.User.findOne({ id: prj.user_id });
                    yield globals_1.dbs.UserMailbox.create({
                        user_uid: developer.uid,
                        category: enums_1.eMailCategory.Normal,
                        title: '정지 해제 안내',
                        content: `정지되었던 ${prj.name} 프로젝트 버젼이 정상화되었습니다.`,
                    }, transaction);
                }));
            }
            if (project_id) {
                yield globals_1.dbs.Project.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                    const prj = yield globals_1.dbs.Project.findOne({ id: project_id }, transaction);
                    // prj.state ^= eProjectState.PermanentBan;
                    prj.state = enums_1.eProjectState.Normal;
                    yield prj.save({ transaction });
                    // send a mail
                    const developer = yield globals_1.dbs.User.findOne({ id: prj.user_id });
                    yield globals_1.dbs.UserMailbox.create({
                        user_uid: developer.uid,
                        category: enums_1.eMailCategory.Normal,
                        title: '정지 해제 안내',
                        content: `정지되었던 ${prj.name} 프로젝트가 정상화되었습니다.`,
                    }, transaction);
                }));
            }
        });
        this.releasePunishedUser = ({ id }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.UserPunished.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const record = yield globals_1.dbs.UserPunished.findOne({ id }, transaction);
                record.is_denied = false;
                yield record.save({ transaction });
                const userClaim = yield globals_1.dbs.UserClaim.findOne({ user_id: record.user_id }, transaction);
                const claim = JSON.parse(userClaim.data);
                claim.zempie.deny[record.category].state = false;
                userClaim.data = claim;
                yield userClaim.save({ transaction });
                yield firebase_admin_1.default.auth().setCustomUserClaims(userClaim.user_uid, claim);
            }));
        });
        this.punishedUserList = ({ user_id, limit = 50, offset = 0, sort = 'id', dir = 'asc' }) => __awaiter(this, void 0, void 0, function* () {
            const records = yield globals_1.dbs.UserPunished.model.findAll({
                where: { user_id },
                attributes: ['id', 'is_denied', 'category', 'reason', 'end_at', 'created_at'],
                order: [[sort, dir]],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            });
            return _.map(records, (d) => d.get({ plain: true }));
        });
    }
}
exports.default = new AdminContentsController();
//# sourceMappingURL=adminContentsController.js.map