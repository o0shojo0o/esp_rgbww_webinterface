/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Controller for okay/cancel dialogs
 */
(function() {
    angular
        .module('rgbwwApp')
        .controller('OkCancelCtrl', OkCancelCtrl);

function OkCancelCtrl($scope, $mdDialog, espConnectionFactory, info) {
    $scope.dialog = {"title": info.title, "msg": info.msg, "buttons":true}
    var close = typeof info.msg_success !== 'undefined' ? false : true;

    $scope.ok = function() {
        espConnectionFactory.systemCMD(info.cmd);
        if(close == true) {
            $mdDialog.hide();
        }
        else
        {
            $scope.dialog.buttons = false;
            $scope.dialog.msg = info.msg_success;
        }

    };
    
    $scope.cancel = function() {
        $mdDialog.cancel();
    };
}

})();