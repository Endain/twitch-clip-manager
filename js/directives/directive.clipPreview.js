angular.module( 'twitch.clips.manager' ).directive( 'clipPreview', [ '$http', 'settingsStorage', function ( $http, settingsStorage ) {
    return {
        restrict: 'C',
        link: function ( scope, element, attrs ) {
            // Get elements
            var container = $( element );
            var spinner = container.find( 'div' );
            var image = container.find( 'img' );
            var video = container.find( 'video' );

            // Keep state variables
            var loaded = false;
            var loading = false;
            var playing = false;
            var inside = false;

            // Set up mouse listeners
            container.on( 'mouseenter', onEnter );
            container.on( 'mouseleave', onLeave );

            // Function to handle on enter
            function onEnter() {
                // If preview is turned off, return immediately
                if( settingsStorage.get( 'preview' ) !== true )
                    return;

                // Flag as inside
                inside = true;

                // If loading, do nothing
                if( !loading ) {
                    // If not loaded, start loading
                    if( !loaded ) {
                        // Display loading indicator
                        spinner.addClass( 'active' );

                        // Flag as loading
                        loading = true;

                        // Download the whole video before playing
                        $http.get( video.attr( 'data-src' ), {
                            'responseType': 'blob'
                        } ).then( function ( response ) {
                            // Extract and set video data
                            video[ 0 ].src = URL.createObjectURL( new Blob( [ response.data ], { type: 'video/mp4' } ) );

                            // Flag as loaded and no longer loading
                            loaded = true;
                            loading = false;

                            // Re-trigger enter or leave event
                            if( inside )
                                onEnter();
                            else
                                onLeave();
                        } );
                    } else if( !playing ) {
                        // Play the video
                        video[ 0 ].currentTime = 0;
                        video[ 0 ].play();

                        // Sync the mute setting
                        video[ 0 ].muted = scope.muted;

                        // Flag as playing
                        playing = true;

                        // Wait for the vide to start then un-hide
                        video.on( 'playing', function () {
                            if( playing ) {
                                // Hide the thumbnail and spinner
                                spinner.removeClass( 'active' );
                                image.addClass( 'hide' );
                            }
                        } );
                    }
                } else {
                    // Show the spinner if still loading
                    spinner.addClass( 'active' );
                }
            }

            // Function to handle on leave
            function onLeave() {
                // Flag as inside
                inside = false;

                // Close loading and restore thumbnail
                spinner.removeClass( 'active' );
                image.removeClass( 'hide' );

                // If the video was playing, stop it
                if( playing ) {
                    video[ 0 ].pause();

                    // Flag as not playing
                    playing = false;
                }
            }
        }
    };
} ] );
