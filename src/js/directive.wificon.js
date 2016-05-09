/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Directive to convert signal quality into svg icons
 */

(function() {

angular
    .module('rgbwwApp')
    .directive('wifiIcon', wifiIcon);

function wifiIcon() {
    function link(scope, element, attrs) {
        function renderSVG() {
            var icon = 'wifi';
            if (attrs.signal <= -100) {
                icon+='0';
            } else if (attrs.signal <= -85) {
                icon+='1';
            } else if (attrs.signal <= -75) {
                icon+='2';
            } else if (attrs.signal <= -60) {
                icon+='3';
            } else  {
                icon+='4';
            }
            if(attrs.secured != 'OPEN') {
                icon+= '_lock';
            }
            element.html( icons[icon] );
        }

        renderSVG();
    }

    return {
        link: link,
        restrict: 'E'
    };
}

})();



