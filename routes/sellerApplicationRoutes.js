const express = require('express');
const router = express.Router();
const protectRoute= require('../middlewares/authMiddleware');
const restrictTo =require('../middlewares/roleMiddleware');

const { 
  viewMyApplications,
  applyForSeller,viewPendingApplications,
  approveSeller,
  rejectSeller
} = require('../controllers/sellerApplicationController');
//use for all routes
router.use(protectRoute);

router.post('/',
restrictTo('customer'),
applyForSeller);

router.get('/me',
restrictTo('customer','seller'),
viewMyApplications);

//application admin routes
router.get('/',
restrictTo('admin','superAdmin'),
viewPendingApplications);

router.patch('/:id/approve',restrictTo('admin','superAdmin'), approveSeller);

router.patch('/:id/reject',restrictTo('admin','superAdmin'), rejectSeller);

module.exports = router;
