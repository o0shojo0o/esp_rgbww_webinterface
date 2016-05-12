/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 *
 * Interceptor for http calls to check if application
 * can reach controller.
 */
(function() {
    angular
        .module('rgbwwApp')
        .factory('OfflineCheckInterceptor', OfflineCheckInterceptor);

function OfflineCheckInterceptor ($rootScope) {
    $rootScope.isOnline = true;
    var Interceptor = {
        responseError: respErr,
        response: resp
    };
    return Interceptor;

    function resp(response) {
        var url = response.config.url;
        if (url.indexOf('.html') == -1) {
            // online
            if( $rootScope.isOnline == false) {
                $rootScope.isOnline = true;
                $rootScope.$broadcast('online');
            }
        }

        return response;
    }

    function respErr(response) {

        if( response == null || response.status <= 0) {
            if($rootScope.isOnline == true) {
                $rootScope.isOnline = false;
                $rootScope.$broadcast('offline');
            }
        }

        return response;
    }
 }

})();
