/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Controller used in the wifi connection dialog
 */
(function() {
    angular
        .module('rgbwwApp')
        .controller('ConnectionCtrl', ConnectionCtrl);

function ConnectionCtrl($scope, $mdDialog, $timeout, espConnectionFactory, esprgbww, wifi) {

    // vara
    $scope.processing = true;
    $scope.condata = wifi;
    $scope.error = false;

    // runs when controller is in scope
    // first saves the configuration data and if successfull
    // initiates the connection process
    saveConfig();

    function restartCMD() {
        espConnectionFactory.systemCMD("restart").then(function(result){
            if(!result) {
                $timeout(restartCMD, 2000);
            }
        });
    }

    function connect() {
        espConnectionFactory.connectWifi(wifi.ssid, wifi.password).then( function(data) {
            $scope.connection = data;
            if(data.status == 2) {
                restartCMD();
            } else if(data.status == -1) {
                $scope.error = "Network error: could not reach the controller. Please try again";
            }
            $scope.processing = false;
        });
    }

    function saveConfig() {
        espConnectionFactory.saveConfig(esprgbww, false).then(function(data) {
            if (data == false) {
                $scope.error = "Failed to save configuration, please try again.";
                $scope.processing = false;
                return;
            }
            connect();
        });
    }

    $scope.cancel = function() {
        $mdDialog.cancel();
    };
}


})();