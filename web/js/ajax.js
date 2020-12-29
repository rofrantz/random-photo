var ajax = function(url, data, callback, type) {
    var data_array, data_string, idx, req, value;
    if (data == null) {
        data = {};
    }
    if (callback == null) {
        callback = function() {};
    }
    if (type == null) {
        //default to a GET request
        type = 'GET';
    }
    data_array = [];
    for (idx in data) {
        value = data[idx];
        data_array.push("" + idx + "=" + value);
    }
    data_string = data_array.join("&");

    req = new XMLHttpRequest();
    req.open(type, url + '?' + data_string, true);
    req.setRequestHeader("Content-type", "application/json");
    req.onreadystatechange = function() {
        if (req.readyState === 4 && req.status === 200) {
            var response = req.responseText;
            return callback(
                req.getResponseHeader('Content-Type').toLocaleLowerCase() == 'application/json'
                    ? JSON.parse(response) : response
            );
        }
    };
    req.send(data_string);

    return req;
};
