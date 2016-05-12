/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Controller handling the OTA update Dialog
 */
(function() {
    angular
        .module('rgbwwApp')
        .controller('OTACtrl', OTACtrl);


function OTACtrl($scope, $mdDialog, $http, $timeout, $window, $rootScope, espConnectionFactory, url, fwversion, webappversion) {
    // vars
    $scope.step = 0;
    $scope.processing = true;
    $scope.ota_error = false;
    $scope.updateinfo = {};
    $scope.updateprogress = {};
    $scope.fwversion = fwversion;
    $scope.webappversion = webappversion;
    $scope.reloadCounter = 15;

    // scope functions
    $scope.processupdate = processupdate;
    $scope.reloadWebIF = reloadWebIF;
    $scope.cancel = cancelDialog;
    $scope.isOnline = checkOnline;

    // init
    initOTACtrl();

    function initOTACtrl() {
        // 0 = checking url
        // 1 = processing update

        $scope.processing = true;
        $http.get(url).then(function(result) {
            //check for valid
            $scope.processing = false;
            var data = result.data;
            if (!safeObjectPath(data, "rom.fw_version") || !safeObjectPath(data, "rom.url") ||
                !safeObjectPath(data, "spiffs.webapp_version") || !safeObjectPath(data, "spiffs.url")) {
                $scope.ota_error = "Received malformed response";
            }
            else
            {
                $scope.updateinfo = data;
            }


        }, function(result) {
            $scope.processing = false;
            if(result.status != -1) {
                $scope.ota_error = result.status + " " + result.statusText;
            } else {
                $scope.ota_error = "Network error - please check your connection"
            }

        });

    }

    var ota_retries = 0;
    function ota_poll(freq) {
        $timeout(function() {
            espConnectionFactory.getUpdatestatus().then(function (result) {
                if (result == false) {

                    if ($scope.step == 2) {

                        if (ota_retries < 10) {
                            ota_retries++;
                            ota_poll(5000);
                        } else {
                            $scope.processing = false;
                            $scope.ota_error = "OTA failed - could not reach the Controller after reboot"
                        }
                    } else {

                        $scope.processing = false;
                        $scope.ota_error = "Network error - could not reach the Controller. Please check your connection"
                    }
                } else {
                    if (result.status == 1) {
                        // processing
                        ota_poll(2000);
                    } else if (result.status == 2) {
                        // download okay - need to reboot
                        $scope.step = 2;
                        espConnectionFactory.systemCMD("restart");
                        ota_poll(5000);

                    } else if (result.status == 3) {
                        // successfull ota after reboot
                        reloadCountDown();
                        $scope.processing = false;

                    } else if (result.status == 4 || result.status == 0) {
                        // error occured
                        $scope.processing = false;
                        $scope.ota_error = "OTA failed - please restart the controller and try again"
                    }
                }

            })
        }, freq);
    }

    function reloadCountDown() {
        $timeout(function() {
            if ($scope.reloadCounter > 0) {
                $scope.reloadCounter--;
                reloadCountDown();
            } else {
                $scope.reloadWebIF();
            }

        }, 1000);
    }

    function reloadWebIF() {
        $window.location.reload();
    }

    function processupdate() {
        $scope.step = 1;
        $scope.processing = true;
        $scope.ota_error = false;

        espConnectionFactory.initUpdate($scope.updateinfo).then(function(result){
            if(result == false) {
                $scope.ota_error = "Network error - could not reach the Controller. Please check your connection";
                $scope.processing = false;
            } else {
                $scope.ota_error = false;
                $scope.processing = true;
                ota_poll(1000);
            }

        });

    }

    function checkOnline() {
        return $rootScope.isOnline;
    }

    function cancelDialog() {
        $mdDialog.cancel();
    }

}

})();