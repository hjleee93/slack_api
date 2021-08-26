import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import * as formidable from 'formidable';
import * as imagemin from 'imagemin';
import * as imageminWebp from 'imagemin-webp';
import { Fields, Files, IncomingForm } from 'formidable';
import Opt from '../../config/opt';
import { getContentType } from "../commons/utils";
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import SendData = ManagedUpload.SendData;
import { logger } from '../commons/logger';
import { IS3Upload } from '../controllers/_interfaces';
import { CreateError, ErrorCodes } from '../commons/errorCodes';
import { responseError } from '../controllers/_convert';

AWS.config.loadFromPath('config/aws/credentials.json');
const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

class FileManager {
    uploadImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // const { user } = req;
            const { fields, files }: any = await this.formidable(req, 500, 500);
            req.params = { ...req.params, ...fields };
            req.files = files;
            next();
        }
        catch(e) {
            responseError(res, e);
        }
    }
    uploadImage2 = (maxFileSizeMB = 100, maxFieldsSizeMB = 20) => {
        return this.uploadFiles(maxFileSizeMB, maxFieldsSizeMB);
    }
    uploadFiles = (maxFileSizeMB = 100, maxFieldsSizeMB = 20) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { err, fields, files }: any = await this.formidable(req, maxFileSizeMB, maxFieldsSizeMB);
                if ( err ) {
                    if ( err.message.includes('maxFileSize') ) {
                        responseError(res, CreateError(ErrorCodes.MAX_FILE_SIZE_EXCEEDED));
                    }
                    else if ( err.message.includes('maxFieldsSize') ) {
                        responseError(res, CreateError(ErrorCodes.MAX_FIELDS_SIZE_EXCEEDED));
                    }
                }
                else {
                    req.params = { ...req.params, ...fields };
                    req.files = files;
                    next();
                }
            }
            catch(e) {
                responseError(res, e);
            }
        }
    }


    private formidable = (req: Request, maxFileSizeMB = 100, maxFieldsSizeMB = 20) => {
        const uploadDir = path.join(__dirname, '..', '..', 'upload');
        if( !fs.existsSync(uploadDir) ) {
            fs.mkdirSync(uploadDir);
        }

        return new Promise((resolve, reject) => {
            const form = new IncomingForm({
                encoding: 'utf-8',
                uploadDir,
                keepExtensions: true,
                maxFileSize: 1024 * 1024 * maxFileSizeMB,
                maxFieldsSize: 1024 * 1024 * maxFieldsSizeMB,
                multiples: false,
            } as any);

            form.parse(req, async (err: any, fields: Fields, files: Files) => {
                logger.debug('fields:', fields);

                // const webps = await this.convertToWebp(_.map(files), 80);

                resolve({
                    err,
                    fields,
                    files
                });
            })
        })
    }

    convertToWebp = async (file: any, quality = 100, del = true) => {
        const uploadDir = path.join(__dirname, '..', '..', 'upload');
        if( !fs.existsSync(uploadDir) ) {
            fs.mkdirSync(uploadDir);
        }
        const _filePath = file.path.replace(/\\/gi, '/')
        const webp = await imagemin([_filePath], {
            destination: uploadDir,
            plugins: [
                imageminWebp({ quality })
            ]
        });
        if ( del ) {
            fs.unlink(file.path, (err) => {
                logger.debug('.jpg 삭제');
            })
        }
        return webp;
    }


    s3upload3 = ({ key, filePath, uid, bucket }: IS3Upload) => {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: `${Opt.AWS.Bucket}/${uid}${bucket}`,
                Key: key,
                // ACL: 'public-read',
                ContentType: getContentType(filePath),
                Body: fs.createReadStream(filePath),
            };

            s3.upload(params, (err: Error, data: SendData) => {
                fs.unlink(filePath, (err) => {
                    logger.debug(`${filePath} 삭제`);
                });

                if (err) {
                    logger.error(err);
                    return reject(err);
                }
                resolve(data);
            })
        })
    }


    s3upload = ({ bucket, key, filePath, uid, subDir }: IS3Upload) => {
        return new Promise((resolve, reject) => {
            const params = {
                // Bucket: `${bucket}/${uid}${subDir}`,
                Bucket: path.join(bucket, uid, subDir).replace(/\\/g, '/'),
                Key: key,
                // ACL: 'public-read',
                ContentType: getContentType(filePath),
                Body: fs.createReadStream(filePath),
            };
            s3.upload(params, (err: Error, data: SendData) => {
                fs.unlink(filePath, (err) => {
                    logger.debug(`${filePath} 삭제`);
                });

                if (err) {
                    logger.error(err);
                    return reject(err);
                }
                resolve(data);
            })
            // const upload = new AWS.S3.ManagedUpload({ service: s3, params });
            // upload.send((err, data) => {
            //     fs.unlink(filePath, (err) => {
            //         console.log('.webp 삭제')
            //     });
            //
            //     if (err) {
            //         console.error(err);
            //         return reject(err);
            //     }
            //     resolve(data);
            // })
        })
    }

    s3upload2 = (Key: string, filePath: string, uid: string, versionPath : string ) => {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: `${Opt.AWS.Bucket}/${uid}/p/${versionPath}`,
                Key,
                ContentType: getContentType( filePath ),
                // ACL: 'public-read',
                Body: fs.createReadStream(filePath),
            };
            const upload = new AWS.S3.ManagedUpload({ service: s3, params });
            upload.send((err, data) => {
                fs.unlink(filePath, (err) => {
                    console.log('.webp 삭제')
                });

                if (err) {
                    console.error(err);
                    return reject(err);
                }
                resolve(data);
            })
        })
    }
}


export default new FileManager()
