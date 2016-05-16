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

function OkCancelCtrl($scope, $mdDialog, $mdToast, espConnectionFactory, info) {

    // vars
    $scope.dialog = {"title": info.title, "msg": info.msg, "buttons":true}
    var close = typeof info.msg_success !== 'undefined' ? false : true;

    // functions
    $scope.ok = dialogAction;
    $scope.cancel = closeDialog;

    function dialogAction() {
        espConnectionFactory.systemCMD(info.cmd).then(function(result){
            if(result == false) {
                $scope.dialog.buttons = true;
                $scope.dialog.msg = 'An error occured, please try again.';
                return;
            }

            if(close == true) {
                $mdDialog.hide();
                return;
            }
            
            $scope.dialog.buttons = false;
            $scope.dialog.msg = info.msg_success;

        });


    };
    
    function closeDialog() {
        $mdDialog.cancel();
    };
}

})();