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
class UserContentController {
    constructor() {
        this.getMailbox = ({ limit = 50, offset = 0 }, user) => __awaiter(this, void 0, void 0, function* () {
            const mails = yield globals_1.dbs.UserMailbox.getMails({ user_uid: user.uid, hide: false, limit, offset });
            return {
                mails: _.map(mails, (mail) => {
                    return {
                        id: mail.id,
                        is_read: mail.is_read,
                        category: mail.category,
                        title: mail.title,
                        created_at: mail.created_at,
                    };
                })
            };
        });
        this.readMail = ({ id }, user) => __awaiter(this, void 0, void 0, function* () {
            return yield globals_1.dbs.UserMailbox.getTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const mail = yield globals_1.dbs.UserMailbox.findOne({ user_uid: user.uid, id, hide: false }, transaction);
                mail.is_read = true;
                yield mail.save({ transaction });
                return {
                    content: mail.content,
                };
            }));
        });
        this.deleteMail = ({ mail_id }, user) => __awaiter(this, void 0, void 0, function* () {
            yield globals_1.dbs.UserMailbox.update({ hide: true }, { user_uid: user.uid, id: mail_id });
        });
    }
}
exports.default = new UserContentController();
//# sourceMappingURL=userContentController.js.map