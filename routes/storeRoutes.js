const express = require('express');
const router = express.Router();
const protectRoute= require('../middlewares/authMiddleware');

const restrictTo=require('../middlewares/roleMiddleware');

const {suspendStore,
activateStore,
addViolation,
  getAllStores,
  getMyStore
}=require('../controllers/storeController');

router.use(protectRoute)

router.patch(
  '/:id/suspend',
  restrictTo('admin','superAdmin'),
  suspendStore
);

router.patch(
  '/:id/activate',
  restrictTo('admin','superAdmin'),
  activateStore
);
router.patch(
  '/:id/violation',
  restrictTo('admin','superAdmin'),
  addViolation
);
router.get('/',
  restrictTo('admin','superAdmin'),
  getAllStores
);
router.get('/me',
  restrictTo('seller'),
  getMyStore
);

module.exports=router;