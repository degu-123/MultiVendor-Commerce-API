const express = require('express');
const router = express.Router();

const {
  getMe,updateMe,
uploadProfile,
changePassword,banAccount,deleteAccount,makeAdmin,
viewUsers
}= require('../controllers/userController');

const protectRoute = require('../middlewares/authMiddleware');
const restrictTo
=require('../middlewares/roleMiddleware');

const {uploadAvatar} = require('../middlewares/multerMiddleware');

// 🔐 Protect ALL routes below
router.use(protectRoute);

// USER ROUTES
router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/update-password', changePassword);
router.post('/me/profile-image', uploadAvatar,uploadProfile);
  //user admin routes
  
router.get('/',
restrictTo('admin','superAdmin'),
viewUsers);

router.patch('/:id/ban',
restrictTo('admin','superAdmin'),
banAccount);

router.patch('/:id/delete',restrictTo('admin','superAdmin'),
deleteAccount);

router.patch('/:id/make-admin',restrictTo('admin','superAdmin'),
   makeAdmin);

module.exports=router