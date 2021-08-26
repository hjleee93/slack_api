import { Router } from 'express';
import convert from '../controllers/_convert';
import { validateFirebaseIdToken } from './_common';
import SupportController from '../controllers/supportController';
import FileManager from '../services/fileManager';


const apiVer = `/api/v1`;

export default (router: Router) => {
    router.get(`${apiVer}/support/notices`,         convert(SupportController.getNotices));
    router.get(`${apiVer}/support/notice/:id`,      convert(SupportController.getNotice));
    // router.get(`${apiVer}/support/faq`,             convert(SupportController.getFaq));

    router.get(`${apiVer}/support/inquiries`,       validateFirebaseIdToken,    convert(SupportController.getMyInquiries));
    router.get(`${apiVer}/support/inquiry/:id`,     validateFirebaseIdToken,    convert(SupportController.getMyInquiry));
    router.post(`${apiVer}/support/inquiry`,        validateFirebaseIdToken,    FileManager.uploadImage2(5, 5), convert(SupportController.askInquiry));
}
