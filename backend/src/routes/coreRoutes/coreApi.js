const express = require('express');

const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

const adminController = require('@/controllers/coreControllers/adminController');
const settingController = require('@/controllers/coreControllers/settingController');

const { singleStorageUpload } = require('@/middlewares/uploadMiddleware');
const { checkCache, clearCacheOnUpdate } = require('@/middlewares/cacheMiddleware');

// //_______________________________ Admin management_______________________________

router.route('/admin/read/:id').get(checkCache, catchErrors(adminController.read));

router.route('/admin/password-update/:id').patch(clearCacheOnUpdate('admin'), catchErrors(adminController.updatePassword));

//_______________________________ Admin Profile _______________________________

router.route('/admin/profile/password').patch(clearCacheOnUpdate('admin'), catchErrors(adminController.updateProfilePassword));
router
  .route('/admin/profile/update')
  .patch(
    singleStorageUpload({ entity: 'admin', fieldName: 'photo', fileType: 'image' }),
    clearCacheOnUpdate('admin'),
    catchErrors(adminController.updateProfile)
  );

// //____________________________________________ API for Global Setting _________________

router.route('/setting/create').post(clearCacheOnUpdate('setting'), catchErrors(settingController.create));
router.route('/setting/read/:id').get(checkCache, catchErrors(settingController.read));
router.route('/setting/update/:id').patch(clearCacheOnUpdate('setting'), catchErrors(settingController.update));
//router.route('/setting/delete/:id).delete(clearCacheOnUpdate('setting'), catchErrors(settingController.delete));
router.route('/setting/search').get(checkCache, catchErrors(settingController.search));
router.route('/setting/list').get(checkCache, catchErrors(settingController.list));
router.route('/setting/listAll').get(checkCache, catchErrors(settingController.listAll));
router.route('/setting/filter').get(checkCache, catchErrors(settingController.filter));
router
  .route('/setting/readBySettingKey/:settingKey')
  .get(checkCache, catchErrors(settingController.readBySettingKey));
router.route('/setting/listBySettingKey').get(checkCache, catchErrors(settingController.listBySettingKey));
router
  .route('/setting/updateBySettingKey/:settingKey?')
  .patch(clearCacheOnUpdate('setting'), catchErrors(settingController.updateBySettingKey));
router
  .route('/setting/upload/:settingKey?')
  .patch(
    catchErrors(
      singleStorageUpload({ entity: 'setting', fieldName: 'settingValue', fileType: 'image' })
    ),
    clearCacheOnUpdate('setting'),
    catchErrors(settingController.updateBySettingKey)
  );
router.route('/setting/updateManySetting').patch(clearCacheOnUpdate('setting'), catchErrors(settingController.updateManySetting));
module.exports = router;
