/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 * Directive for inline svgIcons
 */
(function() {
    
angular
    .module('rgbwwApp')
    .directive('svgIcon', function() {
    function link(scope, element, attrs) {
        element.html( icons[attrs.name] );
    }

    return {
        link: link,
        restrict: 'E'
    };
});

})();