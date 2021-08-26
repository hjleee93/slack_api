import * as fs from 'fs';
import * as crypto from 'crypto';
import cfgOption from '../../config/opt';
import * as jwt from 'jsonwebtoken';
import { IZempieClaims } from '../controllers/_interfaces';
import admin from 'firebase-admin';
import DecodedIdToken = admin.auth.DecodedIdToken;
import { CreateError, ErrorCodes } from './errorCodes';
const path = require('path');


/**
 * capitalize
 */
export function capitalize(str: string, lowercaseRest: boolean = false) : string {
    function makeString(object: string) {
        if (object == null) return '';
        return '' + object;
    }

    str = makeString(str);
    const remainingChars = !lowercaseRest ? str.slice(1) : str.slice(1).toLowerCase();

    return str.charAt(0).toUpperCase() + remainingChars;
}


/**
 *
 */
export function parseBoolean(val: any) {
    if ( typeof val === 'boolean' ) {
        return val;
    }

    if ( typeof val === 'string' ) {
        switch (val.toLowerCase()) {
            case 'true':case 'yes':case '1':
                return true;
            default:
                return false;
        }
    }

    return false;
}

export function IsJsonString(str: string) {
    try {
        const json = JSON.parse(str);
        return (typeof json === 'object');
    } catch (e) {
        return false;
    }
}

/**
 * Password - pbkdf2
 */
export function makePassword(password: string) {
    const opt = cfgOption.password;
    return crypto.pbkdf2Sync(password, opt.salt, opt.iteration, 64, 'sha512').toString('hex');
}
export function verifyPassword(password: string, digest: string) {
    return digest === makePassword(password);
}


/**
 * JWT
 */
export function signJWT(payload: object, expiresIn?: string) {
    const { secret, options } = cfgOption.JWT.access;
    options.expiresIn = expiresIn || options.expiresIn;

    return jwt.sign(payload, secret, options);
}
export function verifyJWT(token: string): any {
    const { secret } = cfgOption.JWT.access;
    return jwt.verify(token, secret);
}


export function updateZempieClaims(user: DecodedIdToken, claims: any) {
    return admin.auth().setCustomUserClaims(user.uid, {
        zempie: {
            ...user.zempie,
            ...claims,
        }
    } as IZempieClaims)
}


/**
 * get files
 */
export function getFiles(dir: string, callback: Function) {
    fs.readdirSync(dir)
        .filter((file) => {
            return ( file.indexOf('_') !== 0 && file.indexOf('.ts') < 0 && file.indexOf('.js.map') < 0 );
        })
        .forEach((file) => {
            const name = path.join(dir, file);
            if( fs.statSync(name).isDirectory() ) {
                return getFiles(name, callback);
            }
            else {
                callback(dir, file);
            }
        });
}



/*
    expires
 */
export function expiresIn(from: string, expires_in: string) {
    let t;
    const w = expires_in[expires_in.length-1];
    if ( w === 'd' ) {
        t = 1000 * 60 * 60* 24;
    }
}


/*
    Date
 */
export function Today(hour = 0, minutes = 0, seconds = 0, milliseconds = 0) {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minutes, milliseconds)
}
export function Yesterday() {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
}
export function afterHours(hour: number) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + hour)
}

export function getContentType(file : any) {
    const ext = path.extname(file);
    if ( ext.includes('.html') ) {
        return 'text/html'
    }
    else if ( ext.includes('.js') ) {
        return 'text/javascript'
    }
    else if ( ext.includes('.json') ) {
        return 'application/json'
    }
    else if ( ext.includes('.css') ) {
        return 'text/css'
    }
    else if ( ext.includes('.jpg') ) {
        return 'image/jpeg'
    }
    else if ( ext.includes('.png') ) {
        return 'image/png'
    }
    else if ( ext.includes('.webp') ) {
        return 'image/webp'
    }
    else if ( ext.includes('.m4a') ) {
        return 'audio/x-m4a'
    }
    else if ( ext.includes('.mp4') ) {
        return 'video/mp4'
    }
    else {
        return undefined
    }
}


/**
 * checker
 */
// 규칙 확인
export function isOK_channelID (channel_id: string) {
    if ( channel_id.search(/\s/) !== -1 ) {
        return false
    }
    const regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\+<>@\#$%&\\\=\(\'\"]/gi;
    if ( regExp.test(channel_id) ) {
        return false
    }
    if ( channel_id.length > 20 ) {
        return false
    }

    return true
}
