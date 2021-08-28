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
const globals_1 = require("../../commons/globals");
const enums_1 = require("../../commons/enums");
const _ = require("lodash");
const errorCodes_1 = require("../../commons/errorCodes");
const utils_1 = require("../../commons/utils");
class AdminStudioController {
    constructor() {
        this.getVersions = (params, admin) => __awaiter(this, void 0, void 0, function* () {
            return yield globals_1.dbs.ProjectVersion.findAll({ state: 'process' }, {
                include: [{
                        model: globals_1.dbs.Project.model,
                    }]
            });
        });
        this.getVersion = ({ version_id }, admin) => __awaiter(this, void 0, void 0, function* () {
            const version = yield globals_1.dbs.ProjectVersion.findOne({
                id: version_id
            });
            const project = yield globals_1.dbs.Project.findOne({
                id: version.project_id
            });
            // const developer = await dbs.Developer.findOne( {
            //     id : project.developer_id
            // });
            return {
                version,
                project,
                // developer
            };
        });
        this.setVersion = (params, admin) => __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.ProjectVersion.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                if (params.state === 'passed') {
                    const version = yield globals_1.dbs.ProjectVersion.findOne({ id: params.id });
                    // params.id = version.id;
                    if (version.autoDeploy) {
                        const project = yield globals_1.dbs.Project.findOne({ id: version.project_id }, transaction);
                        const game = yield globals_1.dbs.Game.findOne({ id: project.game_id }, transaction);
                        game.activated = true;
                        game.enabled = true;
                        game.version = version.version;
                        game.url_game = version.url;
                        params.state = 'deploy';
                        if (project.deploy_version_id) {
                            const preDeployVersion = yield globals_1.dbs.ProjectVersion.findOne({ id: project.deploy_version_id }, transaction);
                            preDeployVersion.state = 'passed';
                            yield preDeployVersion.save({ transaction });
                        }
                        project.deploy_version_id = version.id;
                        if (project.update_version_id === version.id) {
                            project.update_version_id = null;
                        }
                        yield project.save({ transaction });
                        yield game.save({ transaction });
                        const developer = yield globals_1.dbs.User.findOne({ id: game.user_id });
                        yield globals_1.dbs.UserMailbox.create({
                            user_uid: developer.uid,
                            category: enums_1.eMailCategory.AllowProjectVersion,
                            title: '심사 승인 통과',
                            content: `배포 대기 중입니다.`,
                        }, transaction);
                    }
                }
                if (params.user_id) {
                    const developer = yield globals_1.dbs.User.findOne({ id: params.user_id });
                    yield globals_1.dbs.UserMailbox.create({
                        user_uid: developer.uid,
                        category: enums_1.eMailCategory.BanProjectVersion,
                        title: '심사 승인 거절',
                        content: `${params.reason}`,
                    }, transaction);
                }
                return yield globals_1.dbs.ProjectVersion.updateVersion(params, transaction);
            }));
        });
        // 설문조사
        this.getSurveys = ({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }) => __awaiter(this, void 0, void 0, function* () {
            const records = yield globals_1.dbs.Survey.findAll({}, {
                order: [[sort, dir]],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            });
            return {
                surveys: _.map(records, (r) => {
                    return {
                        id: r.id,
                        activated: r.activated,
                        form_id: r.form_id,
                        start_at: new Date(r.start_at),
                        end_at: new Date(r.end_at),
                    };
                })
            };
        });
        this.createSurvey = ({ form_id, form_url, start_at, end_at }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Survey.create({
                form_id,
                form_url,
                start_at: new Date(start_at),
                end_at: new Date(end_at),
            });
        });
        this.updateSurvey = ({ id, activated, form_id, start_at, end_at }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Survey.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const record = yield globals_1.dbs.Survey.findOne({ id }, transaction);
                if (!record) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_SURVEY_ID);
                }
                if (!!activated) {
                    record.activated = utils_1.parseBoolean(activated);
                }
                if (form_id) {
                    record.form_id = form_id;
                }
                if (start_at) {
                    record.start_at = new Date(start_at);
                }
                if (end_at) {
                    record.end_at = new Date(end_at);
                }
                yield record.save({ transaction });
            }));
        });
        this.deleteSurvey = ({ id }) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Survey.destroy({ id });
        });
    }
}
exports.default = new AdminStudioController();
//# sourceMappingURL=adminStudioController.js.map