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

function OfflineCheckInterceptor ($rootScope, $q) {
    $rootScope.isOnline = true;
    
    var Interceptor = {
        responseError: respErr,
        response: resp
    };
    return Interceptor;

    function resp(response) {

        // api calls will not have .html file ending
        // templates (even if already included via script tags) will also be loaded via
        // http calls - if we would not check here, we would receive false positive for
        // our online check, if any template is sucessfully loaded

        var url = response.config.url;
        if (url.indexOf('.html') == -1) {
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
        // reject response to trigger proper error handling
        return $q.reject(response);
    }
 }

})();
