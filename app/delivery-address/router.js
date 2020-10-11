const router = require('express').Router();
const multer = require('multer');

const addressController = require('./controller');

router.post('/delivery-addresses', multer().none(), addressController.store);
router.put('/delivery-addresses/:id', multer().none(), addressController.update);
router.delete('/delivery-addresses/:id', multer().none(), addressController.destroy);
router.get('/delivery-addresses/', multer().none(), addressController.index);
module.exports = router;
