/**
 * based on express-stats
 * base code: https://raw.githubusercontent.com/chieffancypants/express-stats/master/index.js
 */



// Averages the sum of all elements in an array
var avg = function(arr) {
    if (arr.length === 0) { return; }
    var sum = arr.reduce(function(prev, curr) { return prev + curr; });
    return sum / arr.length;
};



module.exports = function (options) {
    var stats = {responses: []};

    var defaultOptions = {
        url        : '/health',
        cacheSize  : 100,
        appVersion : undefined,
        statusCheck: function() {}
    };

    // extend the options with defaults:
    options = options || {};
    for (var i in defaultOptions) {
        if (!options[i] && !options.hasOwnProperty(i)) {
            options[i] = defaultOptions[i];
        }
    }

    return function(req, res, next) {
        if (req.url == options.url) {
            res.send({
                appVersion        : options.appVersion,
                status            : options.statusCheck(req, res),
                pid               : process.pid,
                uptimeSecs        : process.uptime(),
                avgResponseTimeMs : avg(stats.responses),
                memory            : process.memoryUsage()
            });
        }
        else {
            res.on('finish', function(data) {
                var time = parseInt( res.get('x-response-time'), 10);
                if (stats.responses.length == options.cacheSize) {
                    stats.responses.shift();
                }
                stats.responses.push(time);
            });
            return next();
        }
    };
};


