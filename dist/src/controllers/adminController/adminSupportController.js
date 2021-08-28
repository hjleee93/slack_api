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
const _ = require("lodash");
const errorCodes_1 = require("../../commons/errorCodes");
const fileManager_1 = require("../../services/fileManager");
const opt_1 = require("../../../config/opt");
const replaceExt = require('replace-ext');
/**
 * 고객지원
 */
class AdminSupportController {
    getUserInquiry({ id }) {
        return __awaiter(this, void 0, void 0, function* () {
            const inquiry = yield globals_1.dbs.UserInquiry.model.findOne({
                where: { id },
                include: [{
                        model: globals_1.dbs.User.model,
                    }, {
                        model: globals_1.dbs.Admin.model,
                    }]
            });
            return {
                inquiry: {
                    id: inquiry.id,
                    category: inquiry.category,
                    title: inquiry.title,
                    text: inquiry.text,
                    url_img: inquiry.url_img,
                    response: inquiry.response,
                    created_at: inquiry.created_at,
                    updated_at: inquiry.updated_at,
                    user: {
                        id: inquiry.user.id,
                        uid: inquiry.user.uid,
                        name: inquiry.user.name,
                        picture: inquiry.user.picture,
                    },
                    admin: {
                        name: inquiry.admin ? inquiry.admin.name : undefined,
                    }
                }
            };
        });
    }
    getUserInquiries({ user_id, no_answer, limit = 50, offset = 0, sort = 'id', dir = 'asc' }) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield globals_1.dbs.UserInquiry.getList({ user_id, no_answer, limit, offset, sort, dir });
        });
    }
    respondInquiry({ id, response }, admin) {
        return __awaiter(this, void 0, void 0, function* () {
            const inquiry = yield globals_1.dbs.UserInquiry.findOne({ id });
            if (inquiry.response) {
                // 어쩔까?
            }
            inquiry.response = response;
            inquiry.admin_id = admin.id;
            inquiry.save();
        });
    }
    getNotices({ limit = 50, offset = 0, sort = 'id', dir = 'asc' }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { count, rows } = yield globals_1.dbs.Notice.findAndCountAll({}, {
                order: [[sort, dir]],
                limit: _.toNumber(limit),
                offset: _.toNumber(offset),
            });
            return {
                count,
                notices: _.map(rows, n => n.get({ plain: true }))
            };
        });
    }
    createNotice({ category, title, content, img_link, start_at, end_at }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Notice.create({ category, title, content, img_link, start_at, end_at });
        });
    }
    updateNotice({ id, category, title, content, img_link, start_at, end_at }) {
        return __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.Notice.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const notice = yield globals_1.dbs.Notice.findOne({ id }, transaction);
                if (!notice) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_NOTICE_ID);
                }
                // 수정수정
                category ? notice.category = category : null;
                title ? notice.title = title : null;
                content ? notice.content = content : null;
                img_link ? notice.img_link = img_link : null;
                start_at ? notice.start_at = new Date(start_at) : null;
                end_at ? notice.end_at = new Date(end_at) : null;
                yield notice.save({ transaction });
            }));
        });
    }
    deleteNotice({ id }) {
        return __awaiter(this, void 0, void 0, function* () {
            return globals_1.dbs.Notice.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const notice = yield globals_1.dbs.Notice.findOne({ id }, transaction);
                if (!notice) {
                    throw errorCodes_1.CreateError(errorCodes_1.ErrorCodes.INVALID_NOTICE_ID);
                }
                yield notice.destroy({ transaction });
            }));
        });
    }
    /**
     * FAQ
     */
    createFAQ({ category, q, a }, admin, { req: { files: { file } } }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.Faq.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const record = yield globals_1.dbs.Faq.create({ category, q, a }, transaction);
                if (file) {
                    const webp = yield fileManager_1.default.convertToWebp(file, 80);
                    const data = yield fileManager_1.default.s3upload({
                        bucket: opt_1.default.AWS.Bucket.Static,
                        key: replaceExt(`${category}_${record.id}`, '.webp'),
                        filePath: webp[0].destinationPath,
                        uid: '',
                        subDir: '/support/faq',
                    });
                    record.url_img = data.Location;
                    yield record.save({ transaction });
                }
            }));
        });
    }
}
exports.default = new AdminSupportController();
//# sourceMappingURL=adminSupportController.js.map