function pageLink(url, cback) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      cback(xhttp)
    }
  };
  xhttp.open('GET', url, true);
  xhttp.send();
}

function replaceContent(xhttp) {
  document.getElementById('main-content').innerHTML = xhttp.responseText;
}