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
      readyToBrowserUrls = [],
      sectionContents = [];
  console.log('sadasdasdasdadddddddddddddddddddddddddddddddddd');
  readyToBrowserUrls = await getBrowserUrls(rule, currentSectionNum);
  let updateSections = await getSection(rule, readyToBrowserUrls);
  console.log(updateSections);
  return updateSections;
}

let getBrowserUrls = (rule, currentSectionNum) => {
  let totalSectionNum = 0;
  return new Promise((resolve, reject) => {
    request(rule.url, {encoding: null}, (err, res, body) => {
      if(err){
        reject(err);
      }else{
        let $ = cheerio.load(iconv.decode(body, 'gbk'));
        $(rule.firstSign).each((index, item) => {
          let firstSignID = $(item).attr(url.inwhatAttr);
          let sectionNum = 0;
          let psectionNum =  parseInt(removeNaN($(item).text()[0]));
          if(isNaN(psectionNum)){
            sectionNum = chinese_parseInt(psectionNum);
          }else{
            sectionNum = psectionNum;
          }
          if(sectionNum > currentSectionNum){
            totalSectionNum++;
            let href = myUrl.resolve(rule.url, firstSignID);
            if(!isInArr(readyToBrowserUrls, href)){
              readyToBrowserUrls.push(href);
            }
            // let sectionTitle = $(item).text()[0].substring($(item).text()[0].indexOf(removeNaN($(item).text()[0])) + 2 ).trim();
            // console.log("sectionTitle-----------> ", sectionTitle);
          }
        });
        if(totalSectionNum >= 1){
          resolve(readyToBrowserUrls);
        }else{
          reject([]);
        }
      }
    });
  });
}

let getSection = (rule, urls) => {
  return new Promise((resolve, reject) => {
    ep.after('getSection', urls.length, (allSection) => {
      resolve(allSection);
    });
    urls.forEach((url, index) => {
      setSection(rule, url, index);
    });
  });

}

let setSection = (rule, url, index) => {
  request(url, {encoding: null}, (err, res, body) => {
    if(err){
      ep.emit('getSection', {status: 0, msg: '请求章节内容时发生错误！'})
    }else{
      let $ = cheerio.load(iconv.decode(body, 'gbk'));

      let sectionContentItem = {
        bookId: rule.bookId,
        sectionTtile: $(rule.titleSign).text()[0],
        sectionContent: $(rule.secondSign).html()
      }
      ep.emit('getSection', {status: 1, data: sectionContentItem})
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
          return false;
        }
      }
    }
    return false;
  }
}

let Compare = (objA, objB) => {
  if(!isObj(onjA) || !isObj(objB)) return false;
  if(getLength(objA) != getLength(onjB)) return false;
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


module.exports = crawl;
