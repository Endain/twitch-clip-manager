angular.module( 'twitch.clips.manager' ).directive( 'clipThumbnail', [ '$http', 'settingsStorage', function ( $http, settingsStorage ) {
    return {
        restrict: 'A',
        priority: 1000,
        link: function ( scope, element, attrs ) {
            // Get element
            var image = $( element );

            // Only prgress if the element is an image element
            if( image.is( 'img' ) ) {
                // If the thumbnail could not load, swap to placeholder
                image.on( 'error', function ( event ) {
                    // Create a new placeholder element
                    var replacement = $( '<div><span>Thumbnail not available</span></div>' );
                    replacement.addClass( 'cover' );
                    replacement.addClass( 'replacement' );

                    // Replace
                    image.replaceWith( replacement );
                } );
            }
        }
    };
} ] );
