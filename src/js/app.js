/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 * 
 */

(function() {
angular
    .module('rgbwwApp', ['ngMaterial','ngAnimate', 'mdColorPicker'])
    .config(function($mdThemingProvider, $httpProvider) {
        $httpProvider.interceptors.push('OfflineCheckInterceptor');
        $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('deep-purple');
        }
    ).run(function($rootScope, $timeout, $mdToast, espConnectionFactory) {
    
    checkConnection();

    function checkConnection() {
        espConnectionFactory.isConnected().then(function(connected){
            $timeout(checkConnection, 4000);
        });
    }

    $rootScope.$on('online', function(e) {
        showConnectionToast(true, 2000);
    });

    $rootScope.$on('offline', function(e) {
        showConnectionToast(false, 0);
    });

    function showConnectionToast(connected, delay) {
        $mdToast.show({
            hideDelay   : delay,
            position    : 'bottom',
            locals: { connected: connected },
            controller: 'ToastCtrl',
            templateUrl : 'ConnectionToast.html'
        });
    }

});
})();
