"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = void 0;
function throwError(res, e, statusCode = 401) {
    res.statusCode = statusCode;
    res.send({
        error: e
    });
}
exports.throwError = throwError;
//# sourceMappingURL=_common.js.map