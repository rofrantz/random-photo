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
                postMessage(buffer.pop());
            } else {
                ajax(data.ajax.url, data.ajax.params, function (photos) {
                    for (var i = 0, max = photos.length; i < max; i++) {
                        if (data.preload) {
                            buffer.push(photos[i]);
                        }

                        self.postMessage(photos[i]);
                    }
                });
            }

            break;
    }
}, false);