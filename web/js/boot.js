var webWorkerSupport = false;
if (typeof(Worker) !== "undefined") {
    webWorkerSupport = true;
}

var apiURL = window.location.href.replace(/\/.[^\/]*\.htm$/, "") + "/";
var apiConfig = {
    per_page: 5
};

var worker;

var loadSinglePhoto = function(preload, photoOptions, successCallback, errorCallback) {
    if (webWorkerSupport) {
        if (typeof(worker) === 'undefined') {
            worker = new Worker('js/photoLoader.js');
        }
    } else {
        alert('no support for web workers');
    }

    worker.onmessage = function (e) {
        if (typeof(e.data) == "object") {
            successCallback(e.data);
        } else {
            console.error("Could not retrieve valid content. Invalid response:" + e.data);
            errorCallback ? errorCallback(e.data) : successCallback(e.data);
        }
    };

    worker.postMessage({
        'cmd': 'loadPhoto',
        'preload': preload,
        'ajax': {
            url: apiURL + 'loadPhoto.php',
            params: $.extend(photoOptions || {}, apiConfig, {per_page: 1})
        }
    });
};
