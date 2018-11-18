(function(){
  var bookAddBtn = document.getElementById('btn-add-book');
  var tips = document.getElementById('tips');
  bookAddBtn.onclick = function(){
    var formElement = document.getElementById('bookElement');
    var formData = new FormData(bookElement);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/book/add', true);
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
