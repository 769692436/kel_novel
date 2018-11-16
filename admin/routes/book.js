var express = require('express');
var router = express.Router();

router.get('/', (req, res, next) => {
  res.render('admin/book', { title: 'Express' });
});

router.get('/add', (req, res, next) => {
  res.render('admin/book_add');
});


module.exports = router;
