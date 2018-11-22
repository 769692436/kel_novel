(function(){
  var sbtBtn = document.getElementById('btn-submit');
  var tips = document.getElementById('tips');
  sbtBtn.onclick = function(){
    var formElement = document.getElementById('sectionItem');
    var formData = new FormData(formElement);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/book/content/modify', true);
    xhr.send(formData);
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
  };
})();
