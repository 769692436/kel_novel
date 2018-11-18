(function(){
  var submitBtn = document.getElementById('submit-rule');
  var tips = document.getElementById('tips');
  submitBtn.onclick = function(e) {
    var formElement = document.getElementById('ruleElement');
    var formData = new FormData(formElement);
    var bookId = document.getElementsByName('bookId')[0].value;
    console.log(bookId);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/admin/book/rule/add/' + bookId, true);
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
  }
})()
