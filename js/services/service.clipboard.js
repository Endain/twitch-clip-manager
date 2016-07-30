angular.module( 'twitch.clips.manager' ).factory( 'clipboard', [ '$rootScope', function ( $rootScope ) {
    // Function to copy given text to the clipboard
    function _copy( text ) {
        // Create an element to copy text from and add the text
        var element = document.createElement( "textarea" );
        element.textContent = text;

        // Add the element to the body temporarily
        var body = document.getElementsByTagName( 'body' )[ 0 ];
        body.appendChild( element );

        // Select the element text
        element.select();

        // Copy the text
        document.execCommand( 'copy' );

        // Cleanup and remove the element
        body.removeChild( element );

        // Broadcast notification
        $rootScope.$emit('notification', 'Copied To Clipboard');
    }

    // Return service API
    return {
        'copy': _copy
    };
} ] );
