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
const server_1 = require("./server");
const slackRoute_1 = require("../routes/slackRoute");
class ApiServer extends server_1.default {
    constructor() {
        super(...arguments);
        this.initialize = (options) => __awaiter(this, void 0, void 0, function* () {
            this.options = options;
            this.setExpress(options);
            yield this.setRDB();
        });
    }
    routes(app) {
        super.routes(app);
        (0, slackRoute_1.default)(app);
    }
}
exports.default = ApiServer;
//# sourceMappingURL=apiServer.js.map