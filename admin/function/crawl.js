let request = require('request'),
    iconv = require('iconv-lite'),
    cheerio = require('cheerio'),
    eventProxy = require('eventproxy'),
    myUrl = require('url');

let ep = new eventProxy();

/*********************
 爬取小说
 根据小说id获取爬取规则
 根据爬取规则进行爬取
**********************/

let crawl = async (rule, length) => {
  let currentSectionNum = length,
      readyToBrowser = [],
      sectionContents = [];
  readyToBrowser = await getUrlsAndSectionNum(rule, currentSectionNum);
  let rs = await getSection(rule, readyToBrowser);
  return rs;
}

let getUrlsAndSectionNum = (rule, currentSectionNum) => {
  return new Promise((resolve, reject) => {
    let totalSectionNum = 0,
        readyToBrowser = [];
    request(rule.url, {encoding: null}, (err, res, body) => {
      if(err){
        reject(err);
      }else{
        let $ = cheerio.load(iconv.decode(body, 'gbk'));
        $(rule.firstSign).each((index, item) => {
          let firstSignID = $(item).attr(rule.inwhatAttr);
          let sectionNum = 0;
          let psectionNum = 0;
          let reg = new RegExp('第.*章');
          let flag = reg.exec($(item).text());
          if(flag){
            psectionNum = removeNaN(flag[0]);
          }else{
            psectionNum =  removeNaN($(item).text());
          }
          if(isNaN(parseInt(psectionNum))){
            sectionNum = chinese_parseInt(psectionNum);
          }else{
            sectionNum = parseInt(psectionNum);
          }
          if(sectionNum > currentSectionNum){
            let href = myUrl.resolve(rule.url, firstSignID);
            let temp = {
              url: href,
              sectionNum: sectionNum
            }
            if(!isInArr(readyToBrowser, temp)){
              console.log(sectionNum, currentSectionNum, totalSectionNum);
              totalSectionNum++;
              readyToBrowser.push(temp);
            }
          }
        });
        if(totalSectionNum >= 1){
          resolve(readyToBrowser);
        }else{
          reject([]);
        }
      }
    });
  });
}

let getSection = (rule, readyToBrowser) => {
  return new Promise((resolve, reject) => {
    ep.after('getSection', readyToBrowser.length, (allSection) => {
      console.log("所有章节请求完毕！");
      resolve(allSection);
    });
    readyToBrowser.forEach((item, index) => {
      setSection(rule, item, index);
    });
  });
}

let setSection = (rule, item, index) => {
  console.log(item.url);
  request(item.url, {encoding: null}, (err, res, body) => {
    if(!err && res.statusCode == 200){
      let $ = cheerio.load(iconv.decode(body, 'gbk'), {decodeEntities: false});

      let sectionContentItem = {
        bookId: parseInt(rule.bookId),
        sectionNum: parseInt(item.sectionNum),
        sectionTtile: $(rule.titleSign).text(),
        sectionContent: $(rule.secondSign).html()
      }
      ep.emit('getSection', sectionContentItem);
    }else{
      let sectionContentItem = {
        bookId: parseInt(rule.bookId),
        sectionNum: parseInt(item.sectionNum),
        sectionTtile: '爬取失败！',
        sectionContent: ''
      }
      ep.emit('getSection', sectionContentItem);
    }
  });
}


let removeNaN = (str) => {
  let standardNum = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '千', '百', '万', '亿', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  if(typeof str == 'string'){
    let strArr = str.split('');
    for(let i = 0; i < strArr.length; i++){
      if(!isInArr(standardNum, strArr[i])){
        strArr[i] = '';
      }
    }
    return strArr.join('');
  }else{
    console.log('你传给removeNaN的参数格式错误，不是一个string！');
    return '';
  }
}

let isInArr = (arr, sameItem) =>{
  if(!arr instanceof Array){
    return false;
  }else{
    for(let i = 0; i < arr.length; i++){
      if(sameItem instanceof Object){
        if(Compare(arr[i], sameItem) == true){
          return true;
        }else{
          continue;
        }
      }else{
        if(arr[i] == sameItem){
          return true;
        }else{
          continue;
        }
      }
    }
    return false;
  }
}

let Compare = (objA, objB) => {
  if(!isObj(objA) || !isObj(objB)) return false;
  if(getLength(objA) != getLength(objB)) return false;
  return CompareObj(objA, objB, true);
}

let isObj = (obj) => {
  return obj && typeof (obj) == 'object' && Object.prototype.toString.call(obj).toLowerCase() == "[object object]";
}

let getLength = (obj) => {
  let count = 0;
  for(let i in obj) count++;
  return count;
}
let CompareObj = (objA, objB, flag) => {
  for(let key in objA){
    if(!flag) break;
    if(!objB.hasOwnProperty(key)) {flag = false; break;}
    if(!isArr(objA[key])) {
      if(objB[key] != objA[key]) {flag = false; break;}
    }else{
      if(!isArr(objB[key])) {flag = flase; break;}
      let oA = objA[key],
          oB = objB[key];
      if(oA.length != oB.length) {flag = false; break;}
      for(let k in oA) {
        if(!flag) break;
        flag = CompareObj(oA[k], oB[k], flag);
      }
    }
  }
  return flag;
}

let isArr = (arr) => {
  return arr && typeof (arr) == 'object' && arr.constructor == Array;
}


let chinese_parseInt = (str) => {
  let chnNumChar = {
      零:0,
      一:1,
      二:2,
      三:3,
      四:4,
      五:5,
      六:6,
      七:7,
      八:8,
      九:9,
  };

  let chnNameValue = {
      十:{value:10, secUnit:false},
      百:{value:100, secUnit:false},
      千:{value:1000, secUnit:false},
      万:{value:10000, secUnit:true},
      亿:{value:100000000, secUnit:true}
  }
  let rtn = 0;
  let section = 0;
  let number = 0;
  let secUnit = false;
  let nstr = str.split('');
  if(nstr[0] == '十'){
    number = 1;
  }
  for(let i = 0; i < nstr.length; i++){
    let num = chnNumChar[nstr[i]];
    if(typeof num !== 'undefined'){
      number = num;
      if(i === nstr.length - 1){
        section += number;
      }
    }else{
      let unit = chnNameValue[nstr[i]].value;
      secUnit = chnNameValue[nstr[i]].secUnit;
      if(secUnit){
          section = (section + number) * unit;
          rtn += section;
          section = 0;
      }else{
          section += (number * unit);
      }
      number = 0;
    }
  }
  return rtn + section;
}




module.exports = crawl;
