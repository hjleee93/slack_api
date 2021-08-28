"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOK_channelID = exports.getContentType = exports.afterHours = exports.Yesterday = exports.Today = exports.expiresIn = exports.getFiles = exports.verifyJWT = exports.signJWT = exports.verifyPassword = exports.makePassword = exports.IsJsonString = exports.parseBoolean = exports.capitalize = void 0;
const fs = require("fs");
const crypto = require("crypto");
const opt_1 = require("../../config/opt");
const jwt = require("jsonwebtoken");
const path = require('path');
/**
 * capitalize
 */
function capitalize(str, lowercaseRest = false) {
    function makeString(object) {
        if (object == null)
            return '';
        return '' + object;
    }
    str = makeString(str);
    const remainingChars = !lowercaseRest ? str.slice(1) : str.slice(1).toLowerCase();
    return str.charAt(0).toUpperCase() + remainingChars;
}
exports.capitalize = capitalize;
/**
 *
 */
function parseBoolean(val) {
    if (typeof val === 'boolean') {
        return val;
    }
    if (typeof val === 'string') {
        switch (val.toLowerCase()) {
            case 'true':
            case 'yes':
            case '1':
                return true;
            default:
                return false;
        }
    }
    return false;
}
exports.parseBoolean = parseBoolean;
function IsJsonString(str) {
    try {
        const json = JSON.parse(str);
        return (typeof json === 'object');
    }
    catch (e) {
        return false;
    }
}
exports.IsJsonString = IsJsonString;
/**
 * Password - pbkdf2
 */
function makePassword(password) {
    const opt = opt_1.default.password;
    return crypto.pbkdf2Sync(password, opt.salt, opt.iteration, 64, 'sha512').toString('hex');
}
exports.makePassword = makePassword;
function verifyPassword(password, digest) {
    return digest === makePassword(password);
}
exports.verifyPassword = verifyPassword;
/**
 * JWT
 */
function signJWT(payload, expiresIn) {
    const { secret, options } = opt_1.default.JWT.access;
    options.expiresIn = expiresIn || options.expiresIn;
    return jwt.sign(payload, secret, options);
}
exports.signJWT = signJWT;
function verifyJWT(token) {
    const { secret } = opt_1.default.JWT.access;
    return jwt.verify(token, secret);
}
exports.verifyJWT = verifyJWT;
/**
 * get files
 */
function getFiles(dir, callback) {
    fs.readdirSync(dir)
        .filter((file) => {
        return (file.indexOf('_') !== 0 && file.indexOf('.ts') < 0 && file.indexOf('.js.map') < 0);
    })
        .forEach((file) => {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            return getFiles(name, callback);
        }
        else {
            callback(dir, file);
        }
    });
}
exports.getFiles = getFiles;
/*
    expires
 */
function expiresIn(from, expires_in) {
    let t;
    const w = expires_in[expires_in.length - 1];
    if (w === 'd') {
        t = 1000 * 60 * 60 * 24;
    }
}
exports.expiresIn = expiresIn;
/*
    Date
 */
function Today(hour = 0, minutes = 0, seconds = 0, milliseconds = 0) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, milliseconds);
}
exports.Today = Today;
function Yesterday() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
}
exports.Yesterday = Yesterday;
function afterHours(hour) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + hour);
}
exports.afterHours = afterHours;
function getContentType(file) {
    const ext = path.extname(file);
    if (ext.includes('.html')) {
        return 'text/html';
    }
    else if (ext.includes('.js')) {
        return 'text/javascript';
    }
    else if (ext.includes('.json')) {
        return 'application/json';
    }
    else if (ext.includes('.css')) {
        return 'text/css';
    }
    else if (ext.includes('.jpg')) {
        return 'image/jpeg';
    }
    else if (ext.includes('.png')) {
        return 'image/png';
    }
    else if (ext.includes('.webp')) {
        return 'image/webp';
    }
    else if (ext.includes('.m4a')) {
        return 'audio/x-m4a';
    }
    else if (ext.includes('.mp4')) {
        return 'video/mp4';
    }
    else {
        return undefined;
    }
}
exports.getContentType = getContentType;
/**
 * checker
 */
// 규칙 확인
function isOK_channelID(channel_id) {
    if (channel_id.search(/\s/) !== -1) {
        return false;
    }
    const regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\+<>@\#$%&\\\=\(\'\"]/gi;
    if (regExp.test(channel_id)) {
        return false;
    }
    if (channel_id.length > 20) {
        return false;
    }
    return true;
}
exports.isOK_channelID = isOK_channelID;
//# sourceMappingURL=utils.js.map