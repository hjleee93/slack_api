import { Request, Response, Router } from 'express';
import RpcController from '../controllers/rpcController';
import { isAuthenticated, isDeveloper, validateFirebaseIdToken } from './_common';
import FileManager from "../services/fileManager";
import convert from "../controllers/_convert";
import StudioController  from '../controllers/studio/studioController';
import AdminStudioController from '../controllers/adminController/adminStudioController';


const apiVer = `/api/v1`;

export default (router: Router) => {
    router.post(`${apiVer}/studio/developer`,    validateFirebaseIdToken,   isAuthenticated,    convert(StudioController.signupDeveloper));

    router.post(`${apiVer}/studio/project`,     validateFirebaseIdToken,    isAuthenticated,    isDeveloper,    FileManager.uploadImage, convert(StudioController.createProject));
    router.get( `${apiVer}/studio/project`,     validateFirebaseIdToken,    isAuthenticated,    convert(StudioController.getProjects));
    router.get(`${apiVer}/studio/projects`,     validateFirebaseIdToken,    isAuthenticated,    isDeveloper,    convert(StudioController.getProjects2));
    router.get( `${apiVer}/studio/project/:id`, validateFirebaseIdToken,    isAuthenticated,    isDeveloper,    convert(StudioController.getProject));
    router.post( `${apiVer}/studio/project/:id`, validateFirebaseIdToken,   isAuthenticated,    isDeveloper,    FileManager.uploadImage, convert(StudioController.updateProject));
    router.delete( `${apiVer}/studio/project/:id`, validateFirebaseIdToken, isAuthenticated,    isDeveloper,    convert(StudioController.deleteProject));

    router.post(`${apiVer}/studio/version`,     validateFirebaseIdToken,    isAuthenticated,    isDeveloper,    FileManager.uploadImage,    convert(StudioController.createVersion));
    router.delete(`${apiVer}/studio/version/:id`, validateFirebaseIdToken,  isAuthenticated,    isDeveloper,    convert(StudioController.deleteVersion));

    router.get( `${apiVer}/studio/verify-pathname/:pathname`, validateFirebaseIdToken, isAuthenticated, isDeveloper, convert(StudioController.verifyGamePathname) );

    // 설문조사
    router.post(`/gf/survey`,   convert(StudioController.callbackSurvey));
    router.get(`${apiVer}/studio/survey`,   validateFirebaseIdToken, isAuthenticated, isDeveloper, convert(StudioController.getCurrentSurveyResult));
}

RpcController.generator( 'admin-get-versions', AdminStudioController.getVersions, true );
RpcController.generator( 'admin-get-version', AdminStudioController.getVersion, true );
RpcController.generator( 'admin-set-version', AdminStudioController.setVersion, true );
