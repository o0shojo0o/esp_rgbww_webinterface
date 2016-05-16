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

    // vars
    var gotConfig = false;
    $scope.netloading = false;
    $scope.wnetwork = {ssid: "", id: "", encryption: "OPEN", password: ""};
    $scope.wlandata = {password: ""};

    // functions
    $scope.isOnline = checkOnline;
    $scope.refreshnetwork = refreshNetwork;
    $scope.connect = doConnect;
    $scope.canconnect = canConnect;
    $scope.webappversion = version;

    // run init when controller is in scope
    init();

    function init() {

        // only run init if we didn`t yet receive the configuration
        // assume the last known configuraiton is correct when
        // we show the initial interface
        if(!gotConfig) {
            $scope.netloading = true;
            espConnectionFactory.getConfig().then(function(data) {
                if (data == false) {
                    gotConfig = false;
                    $scope.esprgbww = {};
                    $scope.netloading = false;
                    return;
                }
                gotConfig = true;
                $scope.esprgbww = data;
                $scope.refreshnetwork(false);

            });
        }
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

    function checkOnline() {
        return $rootScope.isOnline;
    }

    function canConnect() {

        if ( $scope.isOnline() == true && (($scope.wnetwork.ssid != "" &&($scope.wnetwork.encryption == "OPEN") ||
                ($scope.wnetwork.encryption != "OPEN" && $scope.wnetwork.password != "" ))))
        {
            return true;
        }

        return false;
    }
    
    $scope.$on('online', function(e) {
        init();
    });

}

})();