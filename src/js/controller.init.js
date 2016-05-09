/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Controller used for the setup interface
 */
(function() {
angular
    .module('rgbwwApp')
    .controller('initCtrl', initCtrl);
    
function initCtrl($scope, $mdDialog, $mdToast, espConnectionFactory, $rootScope) {
    var vm = this;
    var gotConfig = false;
    $scope.isOnline = $rootScope.online;
    $scope.refreshnetwork = refreshNetwork;
    $scope.connect = doConnect;
    $scope.canconnect = canConnect;
    $scope.webappversion = version;
    $scope.netloading = false;
    $scope.wnetwork = {ssid: "", id: "", encryption: "OPEN", password: ""};
    $scope.wlandata = {password: ""};
    init();

    function init() {
        $scope.netloading = true;
        espConnectionFactory.getConfig().then(function(data) {
            if (data == false) {
                $scope.esprgbww = {};
                $scope.netloading = false;
            } else {
                $scope.esprgbww = data;
                gotConfig = true;
                $scope.refreshnetwork(false);
            }
        });
        /*
         * espConnectionFactory.getInfo().then(function(data) {
         *   $scope.ctrlinfo = data;
         * });
         */
        //
    }


    function refreshNetwork(rescan) {
        $scope.netloading = true;
        espConnectionFactory.getNetworks(rescan).then(function(data){
            if(data == false) {
                $scope.netloading = false;
                $mdToast.showSimple('error fetching networks');
                return;
            }
            $scope.wifidata = data;
            $scope.netloading = false;
        });
    }


     function doConnect(ev) {

        var wifi = {
            ssid: $scope.wnetwork.ssid,
            password: $scope.wlandata.password
        };

        $mdDialog.show({
            controller: 'ConnectionCtrl',
            templateUrl: 'connectiondialog.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            locals: {
                esprgbww: $scope.esprgbww,
                wifi: wifi
            },
            clickOutsideToClose:false
        });
    }

    function canConnect() {

        if ( $scope.isOnline == true && (($scope.wnetwork.ssid != "" &&($scope.wnetwork.encryption == "OPEN") ||
                ($scope.wnetwork.encryption != "OPEN" && $scope.wnetwork.password != "" ))))
        {
            return true;
        }

        return false;
    }


    $rootScope.$watch('online', function(newValue, oldValue) {
        $scope.isOnline = newValue;
        if (newValue !== oldValue) {
            if(newValue && !gotConfig) {
                init();
            }
        }
    });

}

})();