/* Load the json*/
var getJSON = function(url) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.responseType = 'json';
        xhr.onload = function() {
            var status = xhr.status;
            if (status == 200) {
                resolve(xhr.response);
            } else {
                reject(status);
            }
        };
        xhr.send();
    });
};

/* Add the DOM element */
var generateMenu = function(data) {
    var demos = data.demos;
    var menu = document.createElement("div");
    menu.setAttribute("id", "demo-menu");
    var nav = document.createElement("nav");
    var counter = 1;
    var currentDemo = getDemoNameFromUrl();
    demos.forEach(function(demo){
        var demoLink = createLinkEl(demo, counter, currentDemo);
        nav.appendChild(demoLink);
        counter++;
    });

    menu.appendChild(nav);
    document.getElementsByTagName("body")[0].appendChild(menu);
};

/* The name from the URL is used to higlight the current demo */
var getDemoNameFromUrl = function(){
    var url = window.location.href;
    var lastLetter = url.charAt(url.length - 1);
    if (lastLetter === '/') {
        url = url.slice(0, -1);
    }
    var lastPartOfUrl = url.split('/').pop();
    return lastPartOfUrl;
};

/* create the DOM element link for the current demo */
var createLinkEl = function(demo, counter, selected){
    var demoLinkText = document.createTextNode(counter);
    var demoLink = document.createElement("a");
    demoLink.setAttribute('href', demo.url);
    if (selected.indexOf(demo.id) !== -1) {
        demoLink.setAttribute("class", "selected");
    }
    demoLink.appendChild(demoLinkText);
    return demoLink;
};

function init(){
    getJSON('/demo/menu/list.json').then(function(data) {
        generateMenu(data);
    }, function(status) {
        console.log(status);
    });
}

init();
