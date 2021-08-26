import { Request, Response, Router } from 'express';
import convert from '../controllers/_convert';
import AdminController from '../controllers/adminController/adminController';
import AdminUserController from '../controllers/adminController/adminUserController';
import AdminGameController from '../controllers/adminController/adminGameController';
import AdminSupportController from '../controllers/adminController/adminSupportController';
import AdminStudioController from '../controllers/adminController/adminStudioController';
import AdminContentsController from '../controllers/adminController/adminContentsController';
import { adminTracking, validateAdminIdToken } from './_common';
import FileManager from '../services/fileManager';


const apiVer = `/api/v1`;

export default (router: Router) => {
    router.post(`${apiVer}/admin/login`,        convert(AdminController.login));
    router.post(`${apiVer}/admin/logout`,       validateAdminIdToken,   convert(AdminController.logout));
    router.post(`${apiVer}/admin/token`,        convert(AdminController.getAccessTokens));
    router.get(`${apiVer}/admin/verify`,        validateAdminIdToken,   convert(AdminController.verifyToken));


    /**
     * 관리자
     */
    router.get(`${apiVer}/admin/admin/logs`,    validateAdminIdToken,   convert(AdminController.getAdminLogs));
    router.get(`${apiVer}/admin/admin/list`,    validateAdminIdToken,   convert(AdminController.getAdmins));
    router.post(`${apiVer}/admin/admin/add`,    validateAdminIdToken,   adminTracking,  convert(AdminController.addAdmin));
    router.post(`${apiVer}/admin/admin/mod`,    validateAdminIdToken,   adminTracking,  convert(AdminController.updateAdmin));


    /**
     * 사용자
     */
    router.get(`${apiVer}/admin/user/list`,         validateAdminIdToken,   convert(AdminUserController.getUsers));
    router.get(`${apiVer}/admin/user/profile`,      validateAdminIdToken,   convert(AdminUserController.getUserProfile));
    router.post(`${apiVer}/admin/user/ban`,         validateAdminIdToken,   adminTracking,  convert(AdminUserController.banUser));


    /**
     * 게임
     */
    router.get(`${apiVer}/admin/games`,         validateAdminIdToken,   convert(AdminGameController.getGames));
    router.post(`${apiVer}/admin/game/c/p`,     validateAdminIdToken,   adminTracking,  convert(AdminGameController.createAffiliatedGame));
    router.post(`${apiVer}/admin/game/u`,       validateAdminIdToken,   adminTracking,  convert(AdminGameController.updateGame));
    router.post(`${apiVer}/admin/game/u/p`,     validateAdminIdToken,   adminTracking,  convert(AdminGameController.updateAffiliatedGame));
    router.post(`${apiVer}/admin/game/d/p`,     validateAdminIdToken,   adminTracking,  convert(AdminGameController.deleteAffiliatedGame));


    /**
     * 이용 제재
     */
    router.post(`${apiVer}/admin/punish/game`,  validateAdminIdToken,   adminTracking,  convert(AdminContentsController.punishGame));
    router.post(`${apiVer}/admin/punish/user`,  validateAdminIdToken,   adminTracking,  convert(AdminContentsController.punishUser));
    router.post(`${apiVer}/admin/punish/game/release`,  validateAdminIdToken,   adminTracking,  convert(AdminContentsController.releasePunishedGame));
    router.post(`${apiVer}/admin/punish/user/release`,  validateAdminIdToken,   adminTracking,  convert(AdminContentsController.releasePunishedUser));
    router.get(`${apiVer}/admin/punish/user/list`,      validateAdminIdToken,   adminTracking,  convert(AdminContentsController.punishedUserList));

    /**
     * 우편함
     */
    router.post(`${apiVer}/admin/send-mail`,    validateAdminIdToken,   adminTracking,  convert(AdminUserController.sendMail));
    router.post(`${apiVer}/admin/cancel-mail`,  validateAdminIdToken,   adminTracking,  convert(AdminUserController.cancelMail));

    /**
     * 고객지원
     */
    /**
     * 1:1 문의
     */
    router.get(`${apiVer}/admin/support/inquiry`,       validateAdminIdToken,   convert(AdminSupportController.getUserInquiry));
    router.get(`${apiVer}/admin/support/inquiries`,     validateAdminIdToken,   convert(AdminSupportController.getUserInquiries));
    router.post(`${apiVer}/admin/support/response`,     validateAdminIdToken,   adminTracking,  convert(AdminSupportController.respondInquiry))


    /**
     * 공지사항
     */
    router.get(`${apiVer}/admin/support/notices`,       validateAdminIdToken,   convert(AdminSupportController.getNotices));
    router.post(`${apiVer}/admin/support/notice`,       validateAdminIdToken,   adminTracking,  convert(AdminSupportController.createNotice));
    router.post(`${apiVer}/admin/support/notice/mod`,   validateAdminIdToken,   adminTracking,  convert(AdminSupportController.updateNotice));
    router.post(`${apiVer}/admin/support/notice/del`,   validateAdminIdToken,   adminTracking,  convert(AdminSupportController.deleteNotice));


    /**
     * FAQ
     */
    router.post(`${apiVer}/admin/support/faq`,      validateAdminIdToken,   adminTracking,  FileManager.uploadImage2(3, 3),     convert(AdminSupportController.createFAQ));


    /**
     * 비속어
     */
    router.get(`${apiVer}/admin/filter/bad-words`,      validateAdminIdToken,   convert(AdminUserController.getBadWords));
    router.post(`${apiVer}/admin/filter/bad-word/c`,    validateAdminIdToken,   convert(AdminUserController.addBadWord));
    router.post(`${apiVer}/admin/filter/bad-word/u`,    validateAdminIdToken,   convert(AdminUserController.setBadWord));
    router.post(`${apiVer}/admin/filter/bad-word/d`,    validateAdminIdToken,   convert(AdminUserController.delBadWord));

    /**
     * 금지어
     */
    router.get(`${apiVer}/admin/filter/forbidden-words`,      validateAdminIdToken,   convert(AdminUserController.getForbiddenWord));
    router.post(`${apiVer}/admin/filter/forbidden-word/c`,    validateAdminIdToken,   convert(AdminUserController.addForbiddenWord));
    router.post(`${apiVer}/admin/filter/forbidden-word/u`,    validateAdminIdToken,   convert(AdminUserController.setForbiddenWord));
    router.post(`${apiVer}/admin/filter/forbidden-word/d`,    validateAdminIdToken,   convert(AdminUserController.delForbiddenWord));

    // router.get(`${apiVer}/admin/projects`,      validateAdminIdToken,   convert(AdminGameController.getProjects));


    /**
     *
     */
    // router.post(`${apiVer}/admin/notify`,   validateAdminIdToken,    convert(AdminController.notify));


    /**
     * 스튜디오
     *
     */

    router.get(`${apiVer}/admin/studio/version`,       validateAdminIdToken,   convert(AdminStudioController.getVersion));
    router.get(`${apiVer}/admin/studio/versions`,       validateAdminIdToken,   convert(AdminStudioController.getVersions));
    router.post(`${apiVer}/admin/studio/version`,       validateAdminIdToken,   convert(AdminStudioController.setVersion));

    // 설문조사
    router.get(`${apiVer}/admin/studio/surveys`,        validateAdminIdToken,   convert(AdminStudioController.getSurveys));
    router.post(`${apiVer}/admin/studio/survey/c`,      validateAdminIdToken,   adminTracking,  convert(AdminStudioController.createSurvey));
    router.post(`${apiVer}/admin/studio/survey/u`,      validateAdminIdToken,   adminTracking,  convert(AdminStudioController.updateSurvey));
    router.post(`${apiVer}/admin/studio/survey/d`,      validateAdminIdToken,   adminTracking,  convert(AdminStudioController.deleteSurvey));
}
