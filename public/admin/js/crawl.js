(function(){
  var crawlBtn = document.getElementsByClassName('crawl-btn');
  for(var i = 0; i < crawlBtn.length; i++){
    crawlBtn[i].onclick = e => {
      console.log(parseInt(e.target.parentNode.parentNode.firstChild.innerHTML));
      var data = {
        bookId: parseInt(e.target.parentNode.parentNode.firstChild.innerHTML)
      }
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/admin/book/crawl', true);
      xhr.send(data);
      xhr.onreadystatechange = function(){
        if(xhr.readyState == 4 && xhr.status == 200){
          tips.style.opacity = 1;
          var rs = JSON.parse(xhr.responseText);
          if(rs.status == 1){
            tips.innerHTML = rs.msg;
            setTimeout(() => {
              window.location.href="/admin/book/1";
            }, 3000);
          }else{
            tips.innerHTML = rs.msg;
          }
        }
      }
    }
  }
})()
