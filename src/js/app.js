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
        $httpProvider.interceptors.push('InterceptorFactory');
        $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('deep-purple');
        }
    ).run(function($rootScope, $interval, $mdToast, espConnectionFactory) {

    $rootScope.online = true;
    espConnectionFactory.isConnected();
    function showCustomToast(message, delay) {
        $mdToast.show({
            hideDelay   : delay,
            position    : 'bottom',
            locals: { text: message },
            controller: 'ToastCtrl',
            templateUrl : 'ConnectionToast.html'
        });
    };

    $interval(function(){espConnectionFactory.isConnected();},5000);
    $rootScope.$watch('online', function(newValue, oldValue){
        if (newValue !== oldValue) {
            if(newValue == false) {
                showCustomToast('not connected', 0);
            }
            else
            {
                showCustomToast('connected', 3000);
            }
        }
    });
});
})();
