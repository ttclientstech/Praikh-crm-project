const express = require('express');
const { catchErrors } = require('@/handlers/errorHandlers');
const router = express.Router();

const appControllers = require('@/controllers/appControllers');
const { routesList } = require('@/models/utils');

const { singleStorageUpload, cloudinaryStorageUpload } = require('@/middlewares/uploadMiddleware');
const { checkCache, clearCacheOnUpdate } = require('@/middlewares/cacheMiddleware');

const routerApp = (entity, controller) => {
  // Mutating requests -> Clear Cache
  router.route(`/${entity}/create`).post(clearCacheOnUpdate(entity), catchErrors(controller['create']));
  router.route(`/${entity}/update/:id`).patch(clearCacheOnUpdate(entity), catchErrors(controller['update']));
  router.route(`/${entity}/delete/:id`).delete(clearCacheOnUpdate(entity), catchErrors(controller['delete']));
  
  // Reading requests -> Check Cache
  router.route(`/${entity}/read/:id`).get(checkCache, catchErrors(controller['read']));
  router.route(`/${entity}/search`).get(checkCache, catchErrors(controller['search']));
  router.route(`/${entity}/list`).get(checkCache, catchErrors(controller['list']));
  router.route(`/${entity}/listAll`).get(checkCache, catchErrors(controller['listAll']));
  router.route(`/${entity}/filter`).get(checkCache, catchErrors(controller['filter']));
  router.route(`/${entity}/summary`).get(checkCache, catchErrors(controller['summary']));

  if (entity === 'invoice' || entity === 'quote' || entity === 'payment') {
    router.route(`/${entity}/mail`).post(clearCacheOnUpdate(entity), catchErrors(controller['mail']));
  }

  if (entity === 'quote') {
    router.route(`/${entity}/convert/:id`).get(clearCacheOnUpdate(entity), catchErrors(controller['convert']));
  }

  if (entity === 'solarproject') {
    router.route(`/${entity}/upload/:id`).post(
      cloudinaryStorageUpload({ entity: 'solarProject', fieldName: 'file', fileType: 'all' }),
      clearCacheOnUpdate(entity),
      catchErrors(controller['upload'])
    );
    router.route(`/${entity}/delete-document/:id/delete/:docId`).delete(clearCacheOnUpdate(entity), catchErrors(controller['deleteDocument']));
  }
};


const commissionController = require('../../controllers/appControllers/commissionController');

// Custom routes must be defined before generic routes to avoid conflict with /:id
router.route('/commission/verify').post(catchErrors(commissionController.verifyAccessCode));
router.route('/commission/updateCode').patch(clearCacheOnUpdate('commission'), catchErrors(commissionController.updateAccessCode));
router.route('/commission/customLocations').get(checkCache, catchErrors(commissionController.getCustomLocations));
router.route('/commission/addCustomLocation').post(clearCacheOnUpdate('commission'), catchErrors(commissionController.addCustomLocation));

routesList.forEach(({ entity, controllerName }) => {
  const controller = appControllers[controllerName];
  routerApp(entity, controller);
});


module.exports = router;
