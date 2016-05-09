/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Controller used for toast messages
 */
(function() {
    angular
        .module('rgbwwApp')
        .controller('ToastCtrl', ToastCtrl);

function ToastCtrl($scope, msg) {
    $scope.text = msg;
}

})();