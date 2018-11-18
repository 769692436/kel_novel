let config = require('config'),
    dbConfig = config.get('Dev.dbConfig');
let host = dbConfig.host,
    port = dbConfig.port,
    dbName = dbConfig.dbName;
let MongoClient = require('mongodb').MongoClient,
    DB_CONN_STR = "mongodb://" + host + ":" + port +　"/" + dbName;

let MongoDb = function(){};

MongoDb.prototype.insertData = async (collectionName, insertData, whereStr) => {
  let db = await dbConn(dbName);
  let IsRepeat = await checkRepeat(db, collectionName, whereStr);
  if(!IsRepeat){
    let bookId = await getNextId(db, collectionName);
    insertData.bookId = bookId;
    console.log(collectionName);
    let insertRs = await rtInsertRs(db, collectionName, insertData);
    return insertRs;
  }else{
    return({status:0, msg:'已存在该数据！'})
  }
}

MongoDb.prototype.find = async (collectionName, whereStr) => {
  let db = await dbConn(dbName);
  let rs = await rtFindRs(db, collectionName, whereStr);
  return rs;
}

MongoDb.prototype.del = async (collectionName, whereStr) => {
  let db = await dbConn(dbName);
  let IsExi = await checkRepeat(db, collectionName, whereStr);
  if(IsExi){
    let rs = await rtDelRs(db, collectionName, whereStr);
    return rs;
  }
}


let dbConn = (dbName) => {
  return new Promise((resolve, reject) => {
    MongoClient.connect(DB_CONN_STR, (err, db) => {
      if(err){
        reject(err);
      }else{
        resolve(db.db(dbName));
      }
    });
  });
}

let checkRepeat = (db, collectionName, whereStr) => {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).find(whereStr).toArray((err, rs) => {
      if(err){
        reject(err);
      }else if(rs.length === 0){
        resolve(false);
      }else{
        resolve(true);
      }
    });
  });
}

let getNextId = (db, collectionName) => {
  return new Promise((resolve, reject) => {
    db.collection('counters').findOneAndUpdate(
      {_id: collectionName},
      {$inc:{sequence_value:1}},
      {returnNewDocument: true},(err, result) => {
        if(err){
          reject(err);
        }else{
          resolve(result.value.sequence_value);
        }
      }
    );
  });
}

let rtInsertRs = (db, collectionName, insertData) => {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).insertOne(
      insertData,
      (err, rs) => {
        if(err){
          reject ({status: 0, msg: '插入数据失败！'});
        }else{
          resolve ({status: 1, msg: '插入数据成功！'});
        }
      }
    );
  });
}

let rtFindRs = (db, collectionName, whereStr) => {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).find(whereStr).toArray((err, result) => {
      if(err){
        reject({status: 0, err: err});
      }else{
        resolve({status: 1, rs: result});
      }
    });
  });
}

let rtDelRs = (db, collectionName, whereStr) => {
  return new Promise((resolve, reject) => {
    db.collection(collectionName).deleteOne(whereStr, (err, result) => {
      if(err){
        reject({status: 0, err: err});
      }else{
        resolve({status: 1, rs: result});
      }
    });
  });
}



module.exports = MongoDb;
