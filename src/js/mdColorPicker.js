/**
 * @file
 * @author  Patrick Jahns http://github.com/patrickjahns
 *
 * This file is provided under the LGPL v3 license.
 *
 * @section Description
 *
 *  Modified ColorPicker based on the work of Brian Kelley (https://github.com/brianpkelley/md-color-picker)
 */

(function() {

angular
    .module('mdColorPicker', [])
    .directive( 'mdColorPickerHue', ['$rootScope', function($rootScope) {
        return {
            template: '<canvas width="100%" height="100%"></canvas><div class="md-color-picker-marker"></div>',

            controller: ['$scope',function($scope) {

            }],
            link: function( $scope, $element, $attrs ) {

                ////////////////////////////
                // Variables
                ////////////////////////////

                var height;

                var canvas = $element.children()[0];
                var marker = $element.children()[1];
                var context = canvas.getContext('2d');



                ////////////////////////////
                // Functions
                ////////////////////////////

                var getColorByMouse = function getColorByMouse( e ) {
                    var x = e.pageX - offset.x;
                    var y = e.pageY - offset.y;

                    return getColorByPoint( x, y );
                };

                var getColorByTouch = function getColorByTouch( e ){
                    var touchobj = e.changedTouches[0];
                    var x = touchobj.clientX- offset.x;
                    var y = touchobj.clientY - offset.y;
                    return getColorByPoint( x, y );
                };

                var getColorByPoint = function getColorByPoint( x, y ) {

                    x = Math.max( 0, Math.min( x, canvas.width-1 ) );
                    y = Math.max( 0, Math.min( y, canvas.height-1 ) );

                    var imageData = context.getImageData( x, y, 1, 1 ).data;

                    setMarkerCenter( y );

                    var hsl = new tinycolor( {r: imageData[0], g: imageData[1], b: imageData[2] } );
                    return hsl.toHsl().h;

                };

                var setMarkerCenter = function setMarkerCenter( y ) {
                    angular.element(marker).css({'left': '0'});
                    angular.element(marker).css({'top': y - ( marker.offsetHeight  /2 ) + 'px'});
                };


                var draw = function draw()  {

                    height = 255; //$scope.height || $element[0].getBoundingClientRect().height || $element[0].offsetHeight;
                    $element.css({'height': height + 'px'});

                    canvas.height = height;
                    canvas.width = 50;



                    // Create gradient
                    var hueGrd = context.createLinearGradient(90, 0.000, 90, height);

                    // Add colors
                    hueGrd.addColorStop(0.01,	'rgba(255, 0, 0, 1.000)');
                    hueGrd.addColorStop(0.167, 	'rgba(255, 0, 255, 1.000)');
                    hueGrd.addColorStop(0.333, 	'rgba(0, 0, 255, 1.000)');
                    hueGrd.addColorStop(0.500, 	'rgba(0, 255, 255, 1.000)');
                    hueGrd.addColorStop(0.666, 	'rgba(0, 255, 0, 1.000)');
                    hueGrd.addColorStop(0.828, 	'rgba(255, 255, 0, 1.000)');
                    hueGrd.addColorStop(0.999, 	'rgba(255, 0, 0, 1.000)');

                    // Fill with gradient
                    context.fillStyle = hueGrd;
                    context.fillRect( 0, 0, canvas.width, height );
                };

                ////////////////////////////
                // Watchers, Observes, Events
                ////////////////////////////

                //$scope.$watch( function() { return color.getRgb(); }, hslObserver, true );

                var offset = {
                    x: null,
                    y: null
                };

                var $window = angular.element( window );
                $element.on( 'mousedown', function( e ) {
                    // Prevent highlighting
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //$scope.previewUnfocus();

                    $element.css({ 'cursor': 'none' });

                    offset.x = canvas.getBoundingClientRect().left+1;
                    offset.y = canvas.getBoundingClientRect().top;

                    var fn = function( e ) {
                        var hue = getColorByMouse( e );

                        $scope.$broadcast( 'mdColorPicker:spectrumHueChange', {hue: hue});
                    };

                    $window.on( 'mousemove', fn );
                    $window.one( 'mouseup', function( e ) {
                        $window.off( 'mousemove', fn );
                        $element.css({ 'cursor': 'crosshair' });

                        $rootScope.$broadcast('mdColorPicker:updateColor');
                    });

                    // Set the color
                    fn( e );
                });
                $element.on( 'touchstart', function( e ) {
                    // Prevent highlighting
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //$scope.previewUnfocus();

                    offset.x = canvas.getBoundingClientRect().left+1;
                    offset.y = canvas.getBoundingClientRect().top;
                    var fn = function( e ) {
                        var hue = getColorByTouch(e);

                        $scope.$broadcast( 'mdColorPicker:spectrumHueChange', {hue: hue});
                    };
                    $window.on( 'touchmove', fn );
                    $window.one( 'touchend', function( e ) {

                        $window.off( 'touchmove', fn );
                        $rootScope.$broadcast('mdColorPicker:updateColor');
                    });

                    fn(e);

                });
                $scope.$on('mdColorPicker:colorSet', function( e ) {
                    var hsv = $scope.color.toHsv();
                    setMarkerCenter( canvas.height - ( canvas.height * ( hsv.h / 360 ) ) );
                });

                ////////////////////////////
                // init
                ////////////////////////////

                draw();
                var hsv = $scope.color.toHsv();
                setMarkerCenter( canvas.height - ( canvas.height * ( hsv.h / 360 ) ) );


            }
        };
    }])
    .directive( 'mdColorPickerSpectrum', ['$rootScope', function($rootScope) {
        return {
            template: '<canvas width="100%" height="100%"></canvas><div class="md-color-picker-marker"></div>{{hue}}',

            controller: ['$scope',function($scope) {

            }],
            link: function( $scope, $element, $attrs ) {

                ////////////////////////////
                // Variables
                ////////////////////////////
                var height = 255; // Math.ceil( Math.min( $element[0].getBoundingClientRect().width || $element[0].offsetWidth , 255 ) );
                $element.css({'height': height + 'px'});

                var canvas = $element.children()[0];
                canvas.height = height;
                canvas.width = height;


                var marker = $element.children()[1];
                var context = canvas.getContext('2d');
                var currentHue = $scope.color.toHsl().h;


                ////////////////////////////
                // Functions
                ////////////////////////////
                var getColorByMouse = function getColorByMouse( e ) {
                    var x = e.pageX - offset.x;
                    var y = e.pageY - offset.y;

                    return getColorByPoint( x, y );
                };

                var getColorByTouch = function getColorByTouch( e ){
                    var touchobj = e.changedTouches[0];
                    var x = touchobj.clientX- offset.x;
                    var y = touchobj.clientY - offset.y;
                    return getColorByPoint( x, y );
                };

                var getColorByPoint = function getColorByPoint( x, y, forceApply ) {

                    if ( forceApply === undefined ) {
                        forceApply = true;
                    }

                    x = Math.max( 0, Math.min( x, canvas.width-1 ) );
                    y = Math.max( 0, Math.min( y, canvas.height-1 ) );

                    setMarkerCenter(x,y);

                    var imageData = context.getImageData( x, y, 1, 1 ).data;
                    return {
                        r: imageData[0],
                        g: imageData[1],
                        b: imageData[2]
                    };
                };

                var setMarkerCenter = function setMarkerCenter( x, y ) {
                    angular.element(marker).css({'left': x - ( marker.offsetWidth / 2 ) + 'px'});
                    angular.element(marker).css({'top': y - ( marker.offsetHeight  /2 ) + 'px'});
                };

                var getMarkerCenter = function getMarkerCenter() {
                    var returnObj = {
                        x: marker.offsetLeft + ( Math.floor( marker.offsetWidth / 2 ) ),
                        y: marker.offsetTop + ( Math.floor( marker.offsetHeight / 2 ) )
                    };
                    return returnObj;
                };

                var draw = function draw() {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    // White gradient

                    var whiteGrd = context.createLinearGradient(0, 0, canvas.width, 0);

                    whiteGrd.addColorStop(0, 'rgba(255, 255, 255, 1.000)');
                    whiteGrd.addColorStop(1, 'rgba(255, 255, 255, 0.000)');

                    // Black Gradient
                    var blackGrd = context.createLinearGradient(0, 0, 0, canvas.height);

                    blackGrd.addColorStop(0, 'rgba(0, 0, 0, 0.000)');
                    blackGrd.addColorStop(1, 'rgba(0, 0, 0, 1.000)');

                    // Fill with solid
                    context.fillStyle = 'hsl( ' + currentHue + ', 100%, 50%)';
                    context.fillRect( 0, 0, canvas.width, canvas.height );

                    // Fill with white
                    context.fillStyle = whiteGrd;
                    context.fillRect( 0, 0, canvas.width, canvas.height );

                    // Fill with black
                    context.fillStyle = blackGrd;
                    context.fillRect( 0, 0, canvas.width, canvas.height );
                };

                var setColor = function setColor( color ) {
                    $scope.color._r = color.r;
                    $scope.color._g = color.g;
                    $scope.color._b = color.b;
                    $scope.$apply();
                    $scope.$broadcast('mdColorPicker:spectrumColorChange', { color: color });
                };



                ////////////////////////////
                // Watchers, Observers, Events
                ////////////////////////////

                var offset = {
                    x: null,
                    y: null
                };

                var $window = angular.element( window );
                $element.on( 'mousedown', function( e ) {
                    // Prevent highlighting
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //$scope.previewUnfocus();

                    $element.css({ 'cursor': 'none' });

                    offset.x = canvas.getBoundingClientRect().left+1;
                    offset.y = canvas.getBoundingClientRect().top;

                    var fn = function( e ) {
                        var color = getColorByMouse( e );
                        setColor( color );
                    };

                    $window.on( 'mousemove', fn );
                    $window.one( 'mouseup', function( e ) {
                        $window.off( 'mousemove', fn );
                        $element.css({ 'cursor': 'crosshair' });
                        $rootScope.$broadcast('mdColorPicker:updateColor');
                    });

                    // Set the color
                    fn( e );
                });

                $element.on( 'touchstart', function( e ) {
                    // Prevent highlighting
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    //$scope.previewUnfocus();

                    offset.x = canvas.getBoundingClientRect().left+1;
                    offset.y = canvas.getBoundingClientRect().top;

                    var fn = function( e ) {
                        var color = getColorByTouch(e);
                        setColor( color );
                    };
                    $window.on( 'touchmove', fn );
                    $window.one( 'touchend', function( e ) {
                        $window.off( 'touchmove', fn );
                        $rootScope.$broadcast('mdColorPicker:updateColor');
                    });

                    fn(e);

                });



                $scope.$on('mdColorPicker:spectrumHueChange', function( e, args ) {
                    currentHue = args.hue;
                    draw();
                    var markerPos = getMarkerCenter();
                    var color = getColorByPoint( markerPos.x, markerPos.y );
                    setColor( color );

                });

                $scope.$on('mdColorPicker:colorSet', function( e ) {
                    var hsv = $scope.color.toHsv();
                    currentHue = hsv.h;
                    draw();

                    var posX = canvas.width * hsv.s;
                    var posY = canvas.height - ( canvas.height * hsv.v );

                    setMarkerCenter( posX, posY);
                });

                ////////////////////////////
                // init
                ////////////////////////////


                var hsv = $scope.color.toHsv();
                currentHue = hsv.h;
                draw();
                var posX = canvas.width * hsv.s;
                var posY = canvas.height - ( canvas.height * hsv.v );

                setMarkerCenter( posX-7.5, posY-7.5 );

            }
        };
	}]);
    
})();
