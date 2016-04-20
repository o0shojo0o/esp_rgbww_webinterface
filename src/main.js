/**
 * Created by PJ on 05.03.2016.
 */
angular
    .module('rgbwwApp', ['ngMaterial','ngAnimate', 'mdColorPicker'])
    .config(function($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('deep-purple');})
    .factory('espcon', function($http, $timeout) {
        return {
            getConfig: function() {
                return $http.get('/config').then(function(result) {
                    return result.data;
                });
            },
            saveConfig: function(settings, r) {
                var newsettings = JSON.parse(JSON.stringify(settings));
                r = typeof r !== 'undefined' ? r : false;
                if(newsettings.security.settings_password == "" || newsettings.security.settings_secured != 1) {
                    delete newsettings.security.settings_secured;
                    delete newsettings.security.settings_password;

                }
                if(typeof newsettings.network.ap.password == 'undefined' || newsettings.network.ap.password == "" || newsettings.network.ap.secured != 1) {
                    delete newsettings.network.ap.password;
                }
                newsettings.restart = r;
                return $http.post('/config', newsettings).then(function(result){
                    return true;
                }, function(result) {
                    return false;
                });
            },
            getInfo: function() {
                return $http.get('/info').then(function(result){
                    return result.data;
                })
            },
            getNetworks: function(scan) {
                scan = typeof scan !== 'undefined' ? scan : false;
                if (scan == true) {
                    return $http.post('/scan_networks', {cmd:'refresh'}).then(function(result) {
                        if(result.data.success != true) {
                            return {};
                        }
                        var poll = function() {
                            return $timeout(function () {
                                return $http.get('/networks', {timeout: 10000}).then(function (result) {
                                    if (result.data.scanning == false) {
                                        return result.data;
                                    } else {
                                        return poll();
                                    }

                                })
                            }, 2000);
                        };
                        return poll();
                    });
                } else {
                    return $http.get('/networks').then(function (result) {
                        return result.data;
                    })
                };
            },
            setColor: function(color, colortemp) {
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
                    return result.data;
                })
            },
            getColor: function() {
                return $http.get('/color?mode=hsv').then(function(result) {
                    return result.data;
                });
            },
            connectWifi: function(ssid, password) {
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
            },
            systemcmd: function(cmd) {
                var data = {'cmd': cmd};
                return $http.post('/system', data).then(function(result){
                    return true;
                });

            },
            initUpdate: function(update) {
                return $http.post('/update', update).then(function(result) {
                    return result.data;
                })
            },
            getUpdatestatus: function() {
                return $http.get('/update').then(function(result) {
                    return result.data;
                })
            },
            is_connected: function() {
                $http.get('/ping').then(function(result){
                    if(!safeObjectPath(result.data, "ping")) {
                        return true;
                    } else {
                        return false;
                    }

                }, function(result){
                    return false;
                })
            }

        }
    })
    .controller('mainCtrl', function($scope, $mdSidenav, $timeout, $mdDialog, $http, espcon) {
        var init = function () {
            $scope.saving = false;
            $scope.webappversion = version;
            $scope.update = {url: updateurl };
            $scope.color = new tinycolor("rgb (0, 0, 0)");
            $scope.hsvcolor = { whitebalance: 0 };
            $scope.colormodes = [{title:"RGB", id:0}, {title:"RGBWW", id:1}, {title:"RGBCW", id:2}, {title:"RGBWWCW", id:3}];
            $scope.hsvmodes = [{title:"Normal", id:0},{title:"Spektrum", id:1},{title:"Rainbow", id:2}];
            espcon.getInfo().then(function(data) {
                //TODO error handling
                $scope.ctrlinfo = data;
            });
            espcon.getConfig().then(function(data){
                //TODO: check for error and show dialog
                $scope.rgbww = data;
            }, function(data){
                //TODO: error - show dialog
                $scope.rgbww = {};
            });

            espcon.getColor().then(function(data){
                //TODO: check for error and show dialog
                $scope.color = new tinycolor({ h: data.hsv.h, s: data.hsv.s, v: data.hsv.v });
                $scope.hsvcolor.whitebalance = data.hsv.ct;
                $scope.$broadcast( 'mdColorPicker:colorSet');
            });


        };


        $scope.openMenu = function() {
            $mdSidenav('menu').toggle();

        };

        $scope.navigateTo = function(to, event) {
            $mdSidenav('menu').toggle();
            $scope.tabs.selectedIndex = to;

        };

        $scope.setColor = function() {
            espcon.setColor($scope.color, $scope.hsvcolor.whitebalance)
        };
        $scope.saveConfig = function() {
            $scope.saving = true;
            espcon.saveConfig($scope.rgbww, true).then(function(result){
                //Success
                if(result) {
                    console.log("success")
                } else {
                    console.log("failure")
                }
                $scope.saving = false;
            });
        };

        $scope.forget_wifi = function(ev) {

        }

        $scope.initUpdate = function(ev) {
            var url = $scope.update.url;
            var fwversion = $scope.ctrlinfo.firmware;
            var webappversion = $scope.webappversion;
            $mdDialog.show({
                controller: OTACtrl,
                templateUrl: 'otadialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    url: url,
                    fwversion: fwversion,
                    webappversion: webappversion
                },
                clickOutsideToClose:false
            });

        };
        function OTACtrl($scope, $mdDialog, $http, espcon, url, fwversion, webappversion) {
            var init  = function() {
                // 0 = checking url
                // 1 = processing update
                $scope.step = 0;
                $scope.processing = true;
                $scope.error = false;
                $scope.updateinfo = {};
                $scope.updateprogress = {};
                $scope.fwversion = fwversion;
                $scope.webappversion = webappversion;
                $http.get(url).then(function(result) {
                    //check for valid
                   var data = result.data;
                    if (!safeObjectPath(data, "rom.version") || !safeObjectPath(data, "rom.url") ||
                        !safeObjectPath(data, "webapp.version") || !safeObjectPath(data, "webapp.url")) {
                        $scope.error = "received malformed response";
                    }
                    else
                    {
                        //$scope.updateprogress = {rom: ota_text[1], webapp: ota_text[1]};
                        $scope.updateinfo = data;
                    }
                    $scope.processing = false;

                }, function(result) {
                    $scope.processing = false;
                    if(result.status != -1) {
                        $scope.error = result.status + " " + result.statusText;
                    } else {
                        $scope.error = "Network error - please check your connection"
                    }

                });

            };
            $scope.updateprogress = {"rom":ota_text[0], "webapp":ota_text[0]};
            var poll = function() {
                $timeout(function() {
                    espcon.getUpdatestatus().then(function (result) {
                        $scope.updateprogress.rom = ota_text[result.rom_status];
                        $scope.updateprogress.webapp = ota_text[result.ota_status];
                        if (result.ota_status == 1) {
                            poll();
                        } else {
                            $scope.processing = false;
                            if (result.ota_status == 3) {
                                $scope.error = "OTA Failed - please try again"
                            }
                        }

                    }, function (result) {
                        $scope.processing = false;
                        $scope.error = "Network error - please check your connection"
                    })
                }, 1000);
            }
            $scope.processupdate = function() {
                $scope.step = 1;
                $scope.processing = true;
                $scope.error = false;

                espcon.initUpdate($scope.updateinfo).then(function(result){
                    $scope.error = false;
                    $scope.processing = true;
                    $scope.updateprogress.rom = "...";
                    $scope.updateprogress.webapp = "...";
                    poll();
                }, function(result){
                    $scope.error = "Network error - please check your connection"
                    $scope.processing = false;
                });

            };

            $scope.cancel = function() {
                $mdDialog.cancel();
            };
            init();
        }
        function OkCancelCtrl($scope, $mdDialog, espcon, info) {
            $scope.dialog = {"title": info.title, "msg": info.msg, "buttons":true}
            var close = typeof info.msg_success !== 'undefined' ? false : true;

            $scope.ok = function() {
                espcon.systemcmd(info.cmd);
                if(close == true) {
                    $mdDialog.hide();
                }
                else
                {
                    $scope.dialog.buttons = false;
                    $scope.dialog.msg = info.msg_success;
                }

            }
            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        }

        $scope.showConfirm = function(ev, title, cmd, msg, msg_success) {
            var info = {
                "title": title,
                "cmd": cmd,
                "msg": msg,
                "msg_success": msg_success
            }
            $mdDialog.show({
                controller: OkCancelCtrl,
                templateUrl: 'okcancledialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    info: info
                },
                clickOutsideToClose:false
            });
        };

        $scope.exportSettings = function () {

            if (typeof $scope.rgbww === 'object') {

                var data = {
                    network : {
                        mqtt: $scope.rgbww.network.mqtt,
                        udpserver: $scope.rgbww.network.udpserver,
                        tcpserver: $scope.rgbww.network.tcpserver
                    },
                    color: $scope.rgbww.color
                };
                data = JSON.stringify(data, undefined, 2);
            } else {
                data = {}
            }

            var blob = new Blob([data], {type: 'text/json'}),
                e = document.createEvent('MouseEvents'),
                a = document.createElement('a');

            a.download = "rgbwwsetting.json";
            a.href = window.URL.createObjectURL(blob);
            a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
            e.initEvent('click', true, false, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);
            a.dispatchEvent(e);
        };

        $scope.$on('mdColorPicker:updateColor', function(e) {
            $scope.setColor();
        });
        init();

    })
    .controller('initCtrl', function($scope, $mdDialog, $mdToast, espcon) {
        var init = function () {
            $scope.webappversion = version;
            $scope.netloading = true;
            var error = false;
            $scope.wnetwork = {
                ssid: "",
                id: "",
                encryption: "OPEN",
                password: ""
            };

            $scope.wlandata = {
                password: ""
            }
            espcon.getConfig().then(function(data){
                $scope.rgbww = data;
            }, function(data){
                if(error == false) {
                    $mdToast.showSimple('Network error - please reload');
                    error = true;
                }

                $scope.rgbww = {};

            });
            espcon.getInfo().then(function(data) {
                $scope.ctrlinfo = data;
            }, function(data){
                if(error == false) {
                    $mdToast.showSimple('Network error - please reload');
                    error = true;
                }
            });
            $scope.refreshnetwork(false);
        };


        $scope.refreshnetwork = function(rescan) {
            $scope.netloading = true;
            espcon.getNetworks(rescan).then(function(data){
                $scope.wifidata = data;
                $scope.netloading = false;
            }, function(data){
                if(error == false) {
                    $mdToast.showSimple('Error fetching wifi networks');
                    error = true;
                }

            });
        };


        $scope.connect = function(ev) {
            espcon.saveConfig($scope.rgbww, false);
            var wifi = {
                ssid: $scope.wnetwork.ssid,
                password: $scope.wlandata.password
            };
            $mdDialog.show({
                controller: ConnectionCtrl,
                templateUrl: 'connectiondialog.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                locals: {
                    wifi: wifi
                },
                clickOutsideToClose:false
            });
        };

        $scope.canconnect = function() {

            if ( error = false && (($scope.wnetwork.ssid != "" &&($scope.wnetwork.encryption == "OPEN") ||
                    ($scope.wnetwork.encryption != "OPEN" && $scope.wnetwork.password != "" ))))
            {
                return true;
            }
            return false;
        };

        function ConnectionCtrl($scope, $mdDialog, espcon, wifi) {
            $scope.count = 30;
            $scope.processing = true;
            $scope.condata = wifi;
            $scope.networkerror = false;
            espcon.connectWifi(wifi.ssid, wifi.password).then( function(data) {

                $scope.connection = data;
                if(data.status == 2) {
                    espcon.systemcmd("stopapandrestart");
                } else if(data.status == -1) {
                    $scope.networkerror = true;
                }
                $scope.processing = false;

            });

            $scope.cancel = function() {
                $mdDialog.cancel();
            };
        }
        init();
    }).directive('wifiIcon', function() {
        function link(scope, element, attrs) {

            function renderSVG() {
                var icon = 'wifi';
                if (attrs.signal <= -100) {
                    icon+='0';
                } else if (attrs.signal <= -85) {
                    icon+='1';
                } else if (attrs.signal <= -75) {
                    icon+='2';
                } else if (attrs.signal <= -60) {
                    icon+='3';
                } else  {
                    icon+='4';
                }
                if(attrs.secured != 'OPEN') {
                    icon+= '_lock';
                }
                element.html( icons[icon] );
            }

            renderSVG();
        }

        return {
            link: link,
            restrict: 'E'
        };
    }).directive('svgIcon', function() {
        function link(scope, element, attrs) {
            element.html( icons[attrs.name] );
        }

        return {
            link: link,
            restrict: 'E'
        };
    });

/*
 General needed vars and helpers
 */

//https://coderwall.com/p/cvbgia/object-path-validation-a-solution-to-validate-deep-objects
var safeObjectPath = function safeObjectPath( object, properties ) {
    var path = [],
        root = object,
        prop;

    if ( !root ) {
        // if the root object is null we immediately returns
        return false;
    }

    if ( typeof properties === 'string' ) {
        // if a string such as 'foo.bar.baz' is passed,
        // first we convert it into an array of property names
        path = properties ? properties.split('.') : [];
    } else {
        if ( Object.prototype.toString.call( properties ) === '[object Array]' ) {
            // if an array is passed, we don't need to do anything but
            // to assign it to the internal array
            path = properties;
        } else {
            if ( properties ) {
                // if not a string or an array is passed, and the parameter
                // is not null or undefined, we return with false
                return false;
            }
        }
    }

    // if the path is valid or empty we return with true (because the
    // root object is itself a valid path); otherwise false is returned.
    while ( prop = path.shift() ) {
        // UPDATE: before it was used only the if..else statement, but
        // could generate an exception if a inexistent member was found.
        // Now I fixed with a try..catch statement. Thanks to @tarikozket
        // (https://coderwall.com/tarikozket) for the contribution!
        try {
            if ( prop in root ) {
                root = root[prop];
            } else {
                return false;
            }
        } catch(e) {
            return false;
        }
    }

    return true;
}

var updateurl = "http://patrickjahns.github.io/esp_rgbww_firmware/release/version.json";
var version = "{{ VERSION }}";

var ota_text = {
    0: "not updating",
    1: "update in progress",
    2: "update successful",
    3: "update failed"
}

var icons = {
    developer_board:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zm-4 10H4V5h14v14zM6 13h5v4H6zm6-6h4v3h-4zM6 7h5v5H6zm6 4h4v6h-4z"/></svg>',
    done:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    exposure:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 17v2h2v-2h2v-2h-2v-2h-2v2h-2v2h2zm5-15H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM5 5h6v2H5V5zm15 15H4L20 4v16z"/></svg>',
    home:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    info:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
    memory:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 9H9v6h6V9zm-2 4h-2v-2h2v2zm8-2V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/></svg>',
    menu:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
    palette: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
    refresh: '<svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
    router:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.2 5.9l.8-.8C19.6 3.7 17.8 3 16 3s-3.6.7-5 2.1l.8.8C13 4.8 14.5 4.2 16 4.2s3 .6 4.2 1.7zm-.9.8c-.9-.9-2.1-1.4-3.3-1.4s-2.4.5-3.3 1.4l.8.8c.7-.7 1.6-1 2.5-1 .9 0 1.8.3 2.5 1l.8-.8zM19 13h-2V9h-2v4H5c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zM8 18H6v-2h2v2zm3.5 0h-2v-2h2v2zm3.5 0h-2v-2h2v2z"/></svg>',
    security:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>',
    system_update: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v1.99h6v14.03H3V5.49h6V3.5H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-14c0-1.1-.9-2-2-2z"/></svg>',
    tune:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>',
    wifi:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
    wifi0: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-opacity=".3" d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/></svg>',
    wifi0_lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-opacity=".3" d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/></svg>',
    wifi1: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-opacity=".3" d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/><path d="M6.67 14.86L12 21.49v.01l.01-.01 5.33-6.63C17.06 14.65 15.03 13 12 13s-5.06 1.65-5.33 1.86z"/></svg>',
    wifi1_lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23 16v-1.5c0-1.4-1.1-2.5-2.5-2.5S18 13.1 18 14.5V16c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1zm-1 0h-3v-1.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V16z"/><path d="M15.5 14.5c0-2.8 2.2-5 5-5 .4 0 .7 0 1 .1L23.6 7c-.4-.3-4.9-4-11.6-4C5.3 3 .8 6.7.4 7L12 21.5l3.5-4.3v-2.7z" opacity=".3"/><path d="M6.7 14.9l5.3 6.6 3.5-4.3v-2.6c0-.2 0-.5.1-.7-.9-.5-2.2-.9-3.6-.9-3 0-5.1 1.7-5.3 1.9z"/></svg>',
    wifi2: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-opacity=".3" d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/><path d="M4.79 12.52l7.2 8.98H12l.01-.01 7.2-8.98C18.85 12.24 16.1 10 12 10s-6.85 2.24-7.21 2.52z"/></svg>',
    wifi2_lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23 16v-1.5c0-1.4-1.1-2.5-2.5-2.5S18 13.1 18 14.5V16c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1zm-1 0h-3v-1.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V16z"/><path d="M15.5 14.5c0-2.8 2.2-5 5-5 .4 0 .7 0 1 .1L23.6 7c-.4-.3-4.9-4-11.6-4C5.3 3 .8 6.7.4 7L12 21.5l3.5-4.3v-2.7z" opacity=".3"/><path d="M4.8 12.5l7.2 9 3.5-4.4v-2.6c0-1.3.5-2.5 1.4-3.4C15.6 10.5 14 10 12 10c-4.1 0-6.8 2.2-7.2 2.5z"/></svg>',
    wifi3: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill-opacity=".3" d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/><path d="M3.53 10.95l8.46 10.54.01.01.01-.01 8.46-10.54C20.04 10.62 16.81 8 12 8c-4.81 0-8.04 2.62-8.47 2.95z"/></svg>',
    wifi3_lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path opacity=".3" d="M12 3C5.3 3 .8 6.7.4 7l3.2 3.9L12 21.5l3.5-4.3v-2.6c0-2.2 1.4-4 3.3-4.7.3-.1.5-.2.8-.2.3-.1.6-.1.9-.1.4 0 .7 0 1 .1L23.6 7c-.4-.3-4.9-4-11.6-4z"/><path d="M23 16v-1.5c0-1.4-1.1-2.5-2.5-2.5S18 13.1 18 14.5V16c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1zm-1 0h-3v-1.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V16zm-10 5.5l3.5-4.3v-2.6c0-2.2 1.4-4 3.3-4.7C17.3 9 14.9 8 12 8c-4.8 0-8 2.6-8.5 2.9"/></svg>',
    wifi4: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z"/></svg>',
    wifi4_lock: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23 16v-1.5c0-1.4-1.1-2.5-2.5-2.5S18 13.1 18 14.5V16c-.5 0-1 .5-1 1v4c0 .5.5 1 1 1h5c.5 0 1-.5 1-1v-4c0-.5-.5-1-1-1zm-1 0h-3v-1.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5V16zm-6.5-1.5c0-2.8 2.2-5 5-5 .4 0 .7 0 1 .1L23.6 7c-.4-.3-4.9-4-11.6-4C5.3 3 .8 6.7.4 7L12 21.5l3.5-4.4v-2.6z"/></svg>'
};