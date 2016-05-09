/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Service/Factory hosting all methods used for communication
 * with the controllers API
 */

(function() {
angular
    .module('rgbwwApp')
    .factory('espConnectionFactory', espConnectionFactory);

function espConnectionFactory($http, $timeout) {
    var service = {
        getConfig: getConfig,
        saveConfig: saveConfig,
        getInfo: getInfo,
        getNetworks: getNetworks,
        setColor: setColor,
        getColor: getColor,
        connectWifi: connectWifi,
        systemCMD: systemCMD,
        initUpdate: initUpdate,
        getUpdatestatus: getUpdatestatus,
        isConnected: isConnected
    };

    return service;

    function getConfig() {
        return $http.get('/config').then(function(result) {
            return result.data;
        }, function(result) {
            false;
        });
    }
    function saveConfig(settings, r) {
        var newsettings = JSON.parse(JSON.stringify(settings));

        r = typeof r !== 'undefined' ? r : false;
        if (safeObjectPath(newsettings, "api_password") && safeObjectPath(newsettings, "api_secured")) {
            if(typeof newsettings.security.api_password == 'undefined' ||
                newsettings.security.api_password == "" ||
                newsettings.security.api_secured != 1) {

                delete newsettings.security.api_secured;
                delete newsettings.security.api_password;
            }
        }
        if (safeObjectPath(newsettings, "secured") && safeObjectPath(newsettings, "password")) {
            if (typeof newsettings.network.ap.password == 'undefined' ||
                newsettings.network.ap.password == "" ||
                newsettings.network.ap.secured != 1) {

                delete newsettings.network.ap.password;
            }
        }
        newsettings.restart = r;

        return $http.post('/config', newsettings).then(function(result){
            return safeObjectPath(result.data, "success");
        }, function(result) {
            return false;
        });
    }

    function getInfo() {
        return $http.get('/info').then(function(result){
            return result.data;
        }, function(result) {
            return false;
        })
    }

    function getNetworks(scan) {
        scan = typeof scan !== 'undefined' ? scan : false;
        if (scan == true) {
            var retries = 0;
            return $http.post('/scan_networks', {cmd:'refresh'}).then(function(result) {
                if(!safeObjectPath(result.data, "success")) {
                    return false;
                }
                var poll = function() {
                    return $timeout(function () {
                        return $http.get('/networks', {timeout: 10000}).then(function (result) {
                            if (result.data.scanning == false) {
                                return result.data;
                            } else {
                                if (retries < 30) {
                                    retries++;
                                    return poll();
                                } else {
                                    return false;
                                }
                            }

                        })
                    }, 2000);
                };
                return poll();
            });
        } else {
            return $http.get('/networks').then(function (result) {
                return result.data;
            }, function(result) {
                return false;
            })
        }
    }
    function setColor(color, colortemp) {
        var hsv = color.toHsv();
        var data  = {
            hsv: {
                h: hsv.h.toFixed(2),
                s: Math.round(hsv.s * 100),
                v: Math.round(hsv.v * 100),
                ct: colortemp
            },
            cmd: "fade",
            t: 700

        };
        return $http.post('/color', data).then(function (result) {
            return safeObjectPath(result.data, "success");
        }, function(result) {
            return false;
        })
    }

    function getColor() {
        return $http.get('/color?mode=hsv').then(function(result) {
            return result.data;
        }, function (data) {
            return false;

        });
    }

    function connectWifi(ssid, password) {
        var data = {ssid: ssid, password: password};
        var retries = 0;
        var poll = function() {
            return $timeout(function () {
                return $http.get('/connect', {timeout: 10000}).then(function (result) {
                    if (result.data.status != 1) {
                        return result.data;
                    } else {
                        return poll();
                    }

                }, function(result) {
                    if (retries < 5) {
                        retries++;
                        return poll();
                    }
                    var data = {status: -1, error: 'network error'};
                    return data;
                });
            }, 2000);
        };
        return $http.post('/connect', data).then(function(result) {
            return poll();
        }, function(result) {
            //failed to connect
            var data = {status: -1, error: 'network error'};
            return data;
        });
    }

    function systemCMD(cmd) {
        var data = {'cmd': cmd};
        return $http.post('/system', data).then(function(result){
            return safeObjectPath(result.data, "success");
        }, function(result) {
            return false;
        });

    }
    function initUpdate(update) {
        return $http.post('/update', update).then(function(result) {
            return safeObjectPath(result.data, "success");
        }, function (result) {
            return false;
        })
    }

    function getUpdatestatus() {
        return $http.get('/update').then(function(result) {
            return result.data;
        }, function (result) {
            return false;
        })
    }

    function isConnected() {
        $http.get('/ping').then(function(result){
            return safeObjectPath(result.data, "ping");
        }, function(data) {
            return false;
        });
    }
}
})();