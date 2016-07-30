angular.module( 'twitch.clips.manager' ).directive( 'notifications', [ '$compile', '$rootScope', '$timeout', 'settingsStorage', function ( $compile, $rootScope, $timeout, settingsStorage ) {
    // The filter area template
    var template = '' +
        '<div class="notifications">' +
        '   <div class="wrapper" ng-repeat="notification in notifications">' +
        '       <div class="notification slide-in">' +
        '           <span>{{::notification.message}}</span>' +
        '       </div>' +
        '   </div>' +
        '</div>';

    return {
        restrict: 'E',
        scope: {},
        controller: function ( $scope ) {
            // List of notifications
            $scope.notifications = [];

            // Listener for new notifications
            $rootScope.$on( 'notification', function ( event, message ) {
                // Create notification
                var data = {
                    'message': message,
                };

                // Add a notification
                $scope.notifications.push( data );

                // Play a sound effect if sounds are on
                if( settingsStorage.get( 'sounds' ) === true ) {
                    var sound = new Audio( '/audio/notification.mp3' );
                    sound.volume = 0.5;
                    sound.play();
                }

                // Set up function to remove it later
                $timeout( function () {
                    $scope.notifications.shift();
                }, 3000 );
            } )
        },
        link: function ( scope, element, attrs ) {
            // Get elements
            var container = $( template );
            var body = $( document.body );

            // Move container to body
            container.remove();
            body.append( $compile( container )( scope ) );
        }
    };
} ] );
