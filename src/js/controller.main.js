/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Main Applicaiton controller
 */
(function() {
angular
    .module('rgbwwApp')
    .controller('mainCtrl', mainCtrl);

function mainCtrl($scope, $mdSidenav, $mdDialog, $mdToast, $http, $rootScope, espConnectionFactory) {

    $scope.isOnline = checkOnline;
    $scope.saving = false;
    $scope.webappversion = version;
    $scope.color = new tinycolor("rgb (0, 0, 0)");
    $scope.hsvcolor = { whitebalance: 0 };
    $scope.colormodes = colormodes;
    $scope.hsvmodes = hsvmodes;
    init();

    function init() {

        if(!$scope.isOnline()) return;
        fetchInfo();
        fetchColor();
    }

    function fetchInfo() {
        espConnectionFactory.getInfo().then(function(data) {

            if (data == false) {
                $mdToast.showSimple('could not fetch controller information');
                return;
            }
            $scope.ctrlinfo = data;

            espConnectionFactory.getConfig().then(function(data){
                if(data == false) {
                    $mdToast.showSimple('could not fetch controller information');
                    $scope.esprgbww = {};
                    return;
                }
                data.network.connection.ip = $scope.ctrlinfo.connection.ip;
                data.network.connection.netmask = $scope.ctrlinfo.connection.netmask;
                data.network.connection.gateway = $scope.ctrlinfo.connection.gateway;
                $scope.esprgbww = data;
            });
        });
    }

    function fetchColor() {
        espConnectionFactory.getColor().then(function(data){
            if(data == false) {
                $mdToast.showSimple('could not fetch current color');
                return;
            }
            $scope.color = new tinycolor({ h: data.hsv.h, s: data.hsv.s, v: data.hsv.v });
            $scope.hsvcolor.whitebalance = data.hsv.ct;
            $scope.$broadcast( 'mdColorPicker:colorSet');
        });
    }

    $scope.openMenu = function() {
        $mdSidenav('menu').toggle();

    };

    $scope.navigateTo = function(to, event) {
        $mdSidenav('menu').toggle();
        $scope.tabs.selectedIndex = to;

    };

    $scope.setColor = function() {
        espConnectionFactory.setColor($scope.color, $scope.hsvcolor.whitebalance)
    };
    $scope.saveConfig = function() {
        $scope.saving = true;
        espConnectionFactory.saveConfig($scope.esprgbww, true).then(function(result){
            if(result == false) {
             $mdToast.showSimple("something went wrong while saving the configuration");
            }
            $scope.saving = false;
        });
    };

    $scope.initUpdate = function(ev) {
        var url = $scope.esprgbww.ota.url;
        var fwversion = $scope.ctrlinfo.firmware;
        var webappversion = $scope.webappversion;
        $mdDialog.show({
            controller: 'OTACtrl',
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

    $scope.showConfirm = function(ev, title, cmd, msg, msg_success) {
        var info = {
            "title": title,
            "cmd": cmd,
            "msg": msg,
            "msg_success": msg_success
        };
        $mdDialog.show({
            controller: 'OkCancelCtrl',
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

        if (typeof $scope.esprgbww === 'object') {

            var data = {
                network : {
                    mqtt: $scope.esprgbww.network.mqtt,
                    //udpserver: $scope.esprgbww.network.udpserver,
                    //tcpserver: $scope.esprgbww.network.tcpserver
                },
                color: $scope.esprgbww.color
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

    function checkOnline() {
        return $rootScope.isOnline;
    }

    $scope.$on('online', function(e) {
        init();
    });

}
})();