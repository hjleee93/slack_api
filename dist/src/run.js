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
const apiServer_1 = require("./servers/apiServer");
const opt_1 = require("../config/opt");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        tcp: false,
        port: opt_1.default.Server.http.port,
        static_path: [
            { path: '/', route: 'public' },
        ],
        firebase: false,
        rdb: true,
        mdb: false,
        swagger: false,
        graphql: false,
    };
    const apiServer = new apiServer_1.default();
    yield apiServer.initialize2(options);
    yield apiServer.start();
}))();
//# sourceMappingURL=run.js.map