var express = require('express');
var router = express.Router();
let multipart = require('connect-multiparty');
let multipartMiddleware = multipart();
let fs = require('fs');
let path = require('path');
let bookCache = require('../../db/bookCache');
let MongoDb = require('../../db/db');
let Book = new MongoDb();
let bookCollection = 'book';

router.get('/:page', (req, res, next) => {
  let page = req.params.page || 1;
  Book.find(bookCollection, {})
      .then(data => {
        if(data.status == 1){
          let maxPage = Math.ceil(data.rs.length / 10),
              currentPage = page;
          let start = (page - 1) * 10,
              end = start + 10;
          let rs = data.rs.slice(start, end);
          res.render('admin/book', {data: rs, pagination: {length: maxPage, page: currentPage}, bookCache: bookCache});
        }else{

        }
      }).catch(err => {

      });
});

router.get('/add', (req, res, next) => {
  res.render('admin/book_add');
});

router.get('/del/:bookId', (req, res, next) => {
  let whereStr = {
    bookId: parseInt(req.params.bookId)
  }
  console.log(whereStr);
  Book.del(bookCollection, whereStr)
    .then(data => {
      if(data.status == 1){
        res.redirect('/admin/book/1');
      }else{

      }
    }).catch(err => {

    });
});

router.get('/rule/add/:bookId', (req, res, next) => {
  res.render('admin/rule_add', {id: req.params.bookId});
});


router.post('/add', multipartMiddleware, (req, res, next) => {
  let insertData = {
    name: req.body.name,
    author: req.body.author,
    des: req.body.des,
    cid: req.body.cid,
    state: req.body.state,
    cover: '',
    currentLength: 0,
    resource: null,
    updateTime: new Date()
  }
  let coverName = req.files.cover.originalFilename;
  let originPath = req.files.cover.path;
  let targetPath = 'cover/' + coverName;
  saveCover(originPath, targetPath).then(data => {
    if(data.status == 1){
      insertData.cover = targetPath;
      Book.insertData(bookCollection, insertData, {name: insertData.name})
      .then(data => {
        res.send(data);
      }).catch(err => {
        res.send({status:2, msg: '保存失败!'});
      });
    }else{
      res.send({status:2, msg: '保存失败!'});
    }
  }).catch(err => {
      console.log(err);
  });

});

let saveCover = async function(originPath, targetPath) {
  let data = await new Promise((resolve, reject) => {
    fs.readFile(originPath, (err, data) => {
      if(err){
        reject(err);
      }else{
        resolve(data);
      }
    });
  });
  let result = await new Promise((resolve, reject) => {
    fs.writeFile(targetPath, data, (err) => {
      if(err){
        console.log('write file error-》', err);
        reject({status:2, msg: '保存失败!'});
      }else{
        console.log('write file success');
        resolve({status: 1, msg: '保存成功！'});
      }
    });
  });
  return result;
}

module.exports = router;
