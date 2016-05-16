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

    // vars
    $scope.saving = false;
    $scope.webappversion = version;
    $scope.color = new tinycolor("rgb (0, 0, 0)");
    $scope.hsvcolor = { whitebalance: 0 };
    $scope.colormodes = colormodes;
    $scope.hsvmodes = hsvmodes;
    var prev_color = $scope.color;
    var prev_hsvcolor = $scope.hsvcolor;

    // functions
    $scope.isOnline = checkOnline;
    $scope.exportSettings = exportSettings;
    $scope.navigateTo = navigateTo;
    $scope.openMenu = openMenu;
    $scope.setColor = setColor;
    $scope.saveConfig = saveConfig;
    $scope.initUpdate = initUpdate;
    $scope.showConfirm = showConfirm;

    // initialize controller
    init();

    function init() {
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
            prev_color = $scope.color;
            prev_hsvcolor = $scope.hsvcolor;
            $scope.$broadcast('mdColorPicker:colorSet');
        });
    }

    function openMenu() {
        $mdSidenav('menu').toggle();
    }

    function navigateTo(to, event) {
        $mdSidenav('menu').toggle();
        $scope.tabs.selectedIndex = to;
    }

    function setColor() {
        espConnectionFactory.setColor($scope.color, $scope.hsvcolor.whitebalance).then(function(result) {
            if(result == false) {
                $mdToast.showSimple("could not change color");

                // restore colorpicker to old vars
                $scope.color = prev_color;
                $scope.hsvcolor = prev_hsvcolor;
                $scope.$broadcast('mdColorPicker:colorSet');
                return;
            }

            prev_color = $scope.color;
            prev_hsvcolor = $scope.hsvcolor;

        });
    }

    function saveConfig() {
        $scope.saving = true;
        espConnectionFactory.saveConfig($scope.esprgbww, true).then(function(result){
            if(result == false) {
                $mdToast.showSimple("something went wrong while saving the configuration");
            }
            $scope.saving = false;
        });
    }

    function initUpdate(ev) {
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

    }

    function showConfirm(ev, title, cmd, msg, msg_success) {
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
    }

    function exportSettings () {

        if (typeof $scope.esprgbww === 'object') {

            var data = {
                network : {
                    mqtt: $scope.esprgbww.network.mqtt
                },
                color: $scope.esprgbww.color
            };
            data = JSON.stringify(data, undefined, 2)
        } else {
            data = {}
        }

        var blob = new Blob([data], {type: 'text/json'}), e = document.createEvent('MouseEvents'), a = document.createElement('a');
        a.download = "rgbwwsetting.json";
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
    }

    function checkOnline() {
        return $rootScope.isOnline;
    }

    // watches for broadcast
    $scope.$on('mdColorPicker:updateColor', function(e) {
        $scope.setColor();
    });

    $scope.$on('online', function(e) {
        init();
    });

}
})();