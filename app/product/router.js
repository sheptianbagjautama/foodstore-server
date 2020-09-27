const os = require('os');
const router = require('express').Router();
// Agar bisa menggunakan FormData pada saat Hit Point
const multer = require('multer');
const productController = require('./controller');

router.get('/products', productController.index);
router.post('/products', multer({ dest: os.tmpdir() }).single('image'), productController.store);
router.put('/products/:id', multer({ dest: os.tmpdir() }).single('image'), productController.update);
router.delete('/products/:id', productController.destroy);
// Pada kode di atas kita memerintahkan supaya pada endpoint untuk membuat produk agar bisa menerima
// file upload dengan nama image dan menyimpannya terlebih dahulu ke dalam lokasi sementara yaitu pada
// lokasi temp pada sistem operasi di mana aplikasi Express dijalankan.
// Untuk mendapatkan lokasi temp tersebut kita menggunakan kode os.tmpdir().
module.exports = router;
