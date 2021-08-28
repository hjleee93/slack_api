"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const development_1 = require("./development");
const production_1 = require("./production");
const staging_1 = require("./staging");
const local_1 = require("./local");
const opt = {
    local: local_1.default,
    development: development_1.default,
    staging: staging_1.default,
    production: production_1.default
};
let env = process.env.NODE_ENV;
if (!env) {
    env = 'local';
}
exports.default = opt[env];
//# sourceMappingURL=index.js.map