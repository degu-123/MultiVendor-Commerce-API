const express = require('express');
const router = express.Router();
const protectRoute= require('../middlewares/authMiddleware');

const restrictTo=require('../middlewares/roleMiddleware');
const {
  createCatalog,
  getAllCatalogs,
  controlCatalog,
  updateCatalog
}=require('../controllers/catalogController');
router.use(protectRoute);
//access for all but act diffrently
router.get('/',getAllCatalogs);
//admin only routes
router.post('/',
restrictTo('admin','superAdmin'),
createCatalog);

router.patch('/:id',
restrictTo('admin','superAdmin'),
updateCatalog);

router.patch('/:id/status',restrictTo('admin','superAdmin'),
controlCatalog);

module.exports=router;
