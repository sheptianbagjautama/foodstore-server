const router = require('express').Router();
const multer = require('multer');
const tagController = require('./controller');

router.get('/tags', multer().none(), tagController.index);
router.post('/tags', multer().none(), tagController.store);
router.put('/tags/:id', multer().none(), tagController.update);
router.delete('/tags/:id', multer().none(), tagController.destroy);
module.exports = router;
