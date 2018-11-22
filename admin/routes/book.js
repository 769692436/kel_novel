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
let crawl = require('../function/crawl');
let ObjectID = require('mongodb').ObjectID;

router.get('/:page', (req, res, next) => {
  if(req.params.page == 'add'){
    next();
  }else{
    let page = req.params.page || 1;
    Book.find(bookCollection, {}, {bookId: 1})
        .then(data => {
          if(data.status == 1){
            let maxPage = Math.ceil(data.rs.length / 10),
                currentPage = page;
            let start = (page - 1) * 10,
                end = start + 10;
            let rs = data.rs.slice(start, end);
            res.render('admin/book', {data: rs, pagination: {length: maxPage, page: currentPage}, bookCache: bookCache});
          }else{
            console.log(data);
          }
        }).catch(err => {
          console.log(err);
        });
  }
});

router.get('/add', (req, res, next) => {
  res.render('admin/book_add');
});

router.get('/rule/add/:bookId', (req, res, next) => {
  res.render('admin/rule_add', {id: req.params.bookId});
});

router.get('/content/:bookId', (req, res, next) => {
  let currentPage = parseInt(req.params.page);
  let start = (currentPage - 1) * 10,
      end = start + 10;
  if(req.params.bookId == 'modify'){
    next();
  }else{
    Book.find(bookCollection, {bookId: parseInt(req.params.bookId)}, {bookId: 1})
      .then(result => {
        console.log(result);
        let maxPage = Math.ceil(result.rs[0].currentLength / 10);
        if(result.status == 1){
          Book.find('book_content', {bookId: parseInt(req.params.bookId)}, {sectionNum: 1})
            .then(data => {
              if(data.status == 1){
                res.render('admin/book_content', {data: data.rs});
              }else{
                console.log(data);
              }
            }).catch(e => {
              console.log(e);
            });
        }else{
          console.log(result);
        }
      }).catch(e => {
        console.log(e);
      });
  }
});

router.get('/content/modify/:content_id', (req, res, next) => {
  let whereStr = {
    _id: ObjectID(req.params.content_id)
  }
  console.log(whereStr);
  Book.find('book_content', whereStr, {})
    .then(data => {
      if(data.status == 1 && data.rs.length != 0){
        console.log(data);
        res.render('admin/book_content_modify', {data: data.rs[0]});
      }else{
        res.redirect('/admin/book/1');
      }
    }).catch(e => {
      res.redirect('/admin/book/1');
    });
});
//删除小说
router.post('/del', (req, res, next) => {
  let whereStr = {
    bookId: parseInt(req.body.bookId)
  }
  console.log(whereStr);
  Book.del(bookCollection, whereStr)
    .then(data => {
      if(data.status == 1){
        Book.del('book_content', whereStr).then(data => {
          if(data.status == 1){
            res.send({status: 1, msg: '删除成功！'});
          }else{
            res.send({status: 0, msg: '章节内容删除失败！'});
          }
        }).catch(e => {
          res.send({status: 0, msg: '章节内容删除失败！'});
        });
      }else{
        res.send({status: 0, msg: '小说概况删除失败！'});
      }
    }).catch(err => {
      res.send({status: 0, msg: '小说概况删除失败！'});
    });
});



//添加小说
router.post('/add', multipartMiddleware, (req, res, next) => {
  let insertData = {
    name: req.body.name,
    author: req.body.author,
    des: req.body.des,
    cid: parseInt(req.body.cid),
    state: parseInt(req.body.state),
    cover: '',
    currentLength: 0,
    resource: null,
    updateTime: new Date().toLocaleString()
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

//添加小说爬取规则
router.post('/rule/add/:bookId', multipartMiddleware, (req, res, next) => {
  let whereStr = {
    bookId: parseInt(req.body.bookId)
  }
  let updateStr = {
    updateTime: new Date().toLocaleString(),
    resource: {
      bookId: parseInt(req.body.bookId),
      baseUrl: req.body.baseUrl,
      url: req.body.url,
      firstSign: req.body.firstSign,
      inwhatAttr: req.body.inwhatAttr,
      secondSign: req.body.secondSign,
      titleSign: req.body.titleSign,
    }
  }
  Book.update(bookCollection, whereStr, updateStr)
    .then(data => {
      if(data.status == 1){
        res.send({status: 1, msg: '成功添加爬取规则'});
      }else{
        res.send({status: 0, msg: '无法添加爬取规则'});
      }
    }).catch(err => {
        res.send({status: 0, msg: '无法添加爬取规则'});
    });
});

//爬取小说章节内容
router.post('/crawl', (req, res, next) => {
  Book.find(bookCollection, {bookId: req.body.bookId})
    .then(data => {
      if(data.status == 1){
        console.log(data.rs[0]);
        crawl(data.rs[0].resource, data.rs[0].currentLength)
          .then(ldata => {
            Book.insertMany('book_content', ldata).then(rdata => {
              if(rdata.status ==1){
                let currentLength = parseInt(data.rs[0].currentLength) + ldata.length;
                console.log(ldata.length, currentLength,"<---------------------------");

                Book.update(bookCollection, {bookId: parseInt(req.body.bookId)}, {currentLength: currentLength}).then(result => {
                  if(result.status == 1){
                    res.send({status: 1, msg: '已爬取' + ldata.length + "个新章节"})
                  }else{
                    res.send({status: 0, msg: '更新 currentLength 失败！'});
                  }
                }).catch(e => {
                  res.send({status: 0, msg: '更新 currentLength 失败！'});
                });
              }else{
                res.send({status: 0, msg: '爬取失败！'});
              }
            });
          }).catch(e => {
            res.send({status: 0, msg: '爬取失败！'});
          });
      }else{
        res.send({status: 0, msg: '爬取失败！'});
      }
    }).catch(err => {

    });
});

router.post('/content/modify', multipartMiddleware, (req, res, next) => {
  let whereStr = {
    _id: ObjectID(req.body._id)
  }
  let updateStr = {
    sectionNum: parseInt(req.body.sectionNum),
    sectionTtile: req.body.sectionTtile,
    sectionContent: req.body.sectionContent
  }
  console.log(whereStr, updateStr);
  Book.update('book_content', whereStr, updateStr)
    .then(data => {
      if(data.status == 1){
        res.send({status: 1, msg: '成功修改章节内容'});
      }else{
        res.send({status: 0, msg: '无法修改章节内容'});
      }
    }).catch(err => {
        res.send({status: 0, msg: '无法修改章节内容'});
    });
});

//保存封面
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
