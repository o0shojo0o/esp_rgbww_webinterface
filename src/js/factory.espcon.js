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
            return false;
        });
    }

    function saveConfig(settings, r) {
        var newsettings = JSON.parse(JSON.stringify(settings));

        r = typeof r !== 'undefined' ? r : false;
        if (safeObjectPath(newsettings, "api_secured")) {
            if(!safeObjectPath(newsettings, "api_password")) {
                delete newsettings.security.api_secured;
            } else {
                if(typeof newsettings.security.api_password == 'undefined' || newsettings.security.api_password == "" || newsettings.security.api_secured != 1) {
                    delete newsettings.security.api_secured;
                    delete newsettings.security.api_password;
                }
            }
        }
        if (safeObjectPath(newsettings, "secured")) {
            if(!safeObjectPath(newsettings, "password")) {
                delete newsettings.network.ap.secured;
            } else {
                if (typeof newsettings.network.ap.password == 'undefined' || newsettings.network.ap.password == "" || newsettings.network.ap.secured != 1) {
                    delete newsettings.network.ap.secured;
                    delete newsettings.network.ap.password;
                }
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
        var retries = 0;
        function poll() {
            return $http.get('/networks', {timeout: 10000}).then(function (result) {
                if (result.data.scanning == false) {
                    return result.data;
                }
                if (retries < 20) {
                    retries++;
                    return $timeout(poll, 2000);
                }
                return false;
            }, function(result) {
                if (retries < 20) {
                    retries++;
                    return $timeout(poll, 2000);
                }
                return false;
            })
        }

        if (scan == true) {
            return $http.post('/scan_networks', {cmd:'refresh'}).then(function(result) {
                if(!safeObjectPath(result.data, "success")) {
                    return false;
                }
                return poll();
            }, function(result){
                return false;
            });
        }
        return poll();
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
        function poll() {
            return $http.get('/connect', {timeout: 10000}).then(function (result) {
                if (safeObjectPath(result.data, "status") && result.data.status != 1) {
                    return result.data;
                }
                return $timeout(poll, 2000);
            }, function(result) {
                if (retries < 10) {
                    retries++;
                    return $timeout(poll, 2000);
                }
                return {status: -1, error: 'network error'};
            });
        };

        return $http.post('/connect', data).then(function(result) {
            // issued connect, poll status
            return $timeout(poll, 2000);
        }, function(result) {
            //failed to connect
            return {status: -1, error: 'network error'};
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
        return $http.get('/ping', {timeout: 5000}).then(function(result){
            return safeObjectPath(result.data, "ping");
        }, function(data) {
            return false;
        });
    }
}

})();