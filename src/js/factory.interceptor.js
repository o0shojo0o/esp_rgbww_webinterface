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
        .factory('InterceptorFactory', InterceptorFactory);

function InterceptorFactory ($rootScope) {
    var Interceptor = {
        responseError: respErr,
        response: resp
    };
    return Interceptor;

    function resp(response) {
        //$rootScope.status = response.status;
        $rootScope.online = true;
        return response;
    }
    function respErr(response) {
        //$rootScope.status = response.status;
        if(response.status <= 0) {
            $rootScope.online = false;
        }
        return response;
    }
 }

})();
