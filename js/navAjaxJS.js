function getNav() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            document.getElementById("nav").innerHTML = this.responseText;
        }
    }
    xhttp.open("POST", "pages/navigation.html");
    xhttp.send();
}
