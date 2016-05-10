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

function ConnectionCtrl($scope, $mdDialog, espConnectionFactory, esprgbww, wifi) {
    $scope.processing = true;
    $scope.condata = wifi;
    $scope.error = false;

    espConnectionFactory.saveConfig(esprgbww, false).then(function(data) {
        if (data == false) {
            $scope.error = "Failed to save configuration, please try again.";
            $scope.processing = false;
            return;
        }
        espConnectionFactory.connectWifi(wifi.ssid, wifi.password).then( function(data) {
            $scope.connection = data;
            if(data.status == 2) {
                espConnectionFactory.systemCMD("restart");
            } else if(data.status == -1) {
                $scope.error = "Network error: could not reach the controller. Please try again";
            }
            $scope.processing = false;
        });

    });
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
}


})();