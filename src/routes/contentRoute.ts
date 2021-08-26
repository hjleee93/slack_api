import { Request, Response, Router } from 'express';
import convert from '../controllers/_convert';
import { isAuthenticated, validateFirebaseIdToken } from './_common';
import FileManager from "../services/fileManager";
import TimelineController from '../controllers/timelineController';
import NoticeController from '../controllers/noticeController';
import SocialMediaController from '../controllers/socialMediaControlller';
import CommunityController from '../controllers/communityController';


const apiVer = `/api/v1`;

export default (router: Router) => {

    router.get(`${apiVer}/timeline`,        validateFirebaseIdToken,    convert(TimelineController.getList));
    router.get(`${apiVer}/notice`,          validateFirebaseIdToken,    convert(NoticeController.getList));


    // social media - follow
    router.post(`${apiVer}/sm/follow`,      validateFirebaseIdToken,    convert(SocialMediaController.follow));
    router.post(`${apiVer}/sm/un-follow`,   validateFirebaseIdToken,    convert(SocialMediaController.unFollow));
    router.get(`${apiVer}/sm/following`,    validateFirebaseIdToken,    convert(SocialMediaController.following));
    router.get(`${apiVer}/sm/followers`,    validateFirebaseIdToken,    convert(SocialMediaController.followers));



    // social media - DM ( direct message )
    router.post(`${apiVer}/dm/send`);
    router.get(`${apiVer}/dm/list`);



    // for community
    router.post(`${apiVer}/community/att`,      validateFirebaseIdToken,    isAuthenticated,    FileManager.uploadFiles(200, 40),   convert(CommunityController.uploadFile));
    router.post(`${apiVer}/community/att/i`,    validateFirebaseIdToken,    isAuthenticated,    FileManager.uploadFiles(20, 4),     convert(CommunityController.uploadFile));
    router.post(`${apiVer}/community/att/a`,    validateFirebaseIdToken,    isAuthenticated,    FileManager.uploadFiles(40, 8),     convert(CommunityController.uploadFile));
    router.post(`${apiVer}/community/att/v`,    validateFirebaseIdToken,    isAuthenticated,    FileManager.uploadFiles(40, 40),    convert(CommunityController.uploadFile));
}
