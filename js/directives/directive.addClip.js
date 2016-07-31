angular.module( 'twitch.clips.manager' ).directive( 'addClip', [ '$timeout', function ( $timeout ) {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        template: '' +
            '<span class="add-clip header-icon pull-right">' +
            '   <i class="icon icon-plus"></i>' +
            '   <form ng-submit="validateLink()">' +
            '       <input class="add-clip-input" placeholder="Twitch Clip URL" ng-model="link" />' +
            '   </form>' +
            '</span>',
        controller: function ( $scope ) {
            // Current link text to bind to
            $scope.link = '';

            // Function to validate when the model changes
            $scope.validateLink = function () {
                var validator = new RegExp( '^https:\/\/clips.twitch.tv\/.+\/.+' );

                // Check if a valid link is given
                if( validator.test( $scope.link ) ) {
                    var link = $scope.link;

                    // Clear the link
                    $scope.link = '';

                    // Send to backend for adding
                    chrome.runtime.sendMessage( { 'add': link }, function ( response ) {
                        console.log( response );
                        // If response is a notification, display it
                        if( response && response.notification ) {
                            $timeout( function () {
                                $scope.$emit( 'notification', response.notification );
                            } );
                        }
                    } );
                }
            }
        },
        link: function ( scope, element, attrs ) {
            // Get elements
            var container = $( element );
            var input = container.find( 'input' );

            // Keep the last focused element
            var focused = null;

            // Set up listeners for when mouse enters the container
            container.on( 'mouseenter', focusInput );
            container.on( 'mouseleave', returnFocus );

            // Function to focus on the input
            function focusInput() {
                // Store the currently focused element
                focused = document.activeElement;

                // Focus the input
                input.focus();
            }

            // Function to return focus to its previous input
            function returnFocus() {
                if( focused )
                    focused.focus();
            }
        }
    };
} ] );
