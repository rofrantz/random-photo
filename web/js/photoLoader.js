importScripts('ajax.js');

var buffer = [];

self.addEventListener('message', function(e) {
    var data = e.data;
    var useCache = true;
    if (typeof(data.ajax.params.useCache) !== 'undefined') {
        useCache = data.ajax.params.useCache;
        delete data.ajax.params.useCache;
    }

    switch (data.cmd) {
        case 'loadPhoto':
            if (buffer.length && useCache) {
                var message = buffer.pop();
                if (typeof(message) == "object") {
                    postMessage(message);
                    return;
                } else {
                    console.log(buffer);
                    throw "HERE2: " + message + ", " + buffer.length;
                }
            }

            ajax(data.ajax.url, data.ajax.params, function (photos) {
                if (typeof(photos) == "object") {
                    for (var i = 0, max = photos.length; i < max; i++) {
                        var content = photos[i];
                        if (data.preload) {
                            buffer.push(photos[i]);
                        }

                        self.postMessage(content);
                    }
                } else {
                    self.postMessage(photos);
                }
            });

            break;
    }
}, false);