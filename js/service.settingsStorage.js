angular.module( 'twitch.clips.manager' ).factory( 'settingsStorage', [ '$rootScope', '$timeout', function ( $rootScope, $timeout ) {
    // Keep a local sync of the current settings
    var settings = {};

    // Flag to denote if this service fired off a load message
    var sync = false;

    // Function to get a settings state
    function _get( name ) {
        // If the setting exists return it, otherwise reutrn null
        if( settings[ name ] !== undefined )
            return settings[ name ] ? true : false;

        return null;
    }

    // Function to set a settings state
    function _set( name, value ) {
        // Write the value
        settings[ name ] = value ? true : false;

        // Write the current settings to local storage
        _write();
    }

    // Function to write the settings to storage
    function _write() {
        // Write to local storage
        chrome.storage.local.set( { 'settings': settings }, function () {
            // On completion, send a global message for other pages
            chrome.runtime.sendMessage( { 'settings': true }, function () {} );
        } );
    }

    // Function to load the settings intitially
    function _load() {
        chrome.storage.local.get( 'settings', function ( data ) {
            // If data found, load it, otherwise insert default data
            if( data && data.settings ) {
                // Wrap in $timeout to bring back into the Angular cycle
                $timeout( function () {
                    // Store data to settings object
                    settings = data.settings;

                    // Broadcast to app that settings loaded
                    $rootScope.$broadcast( 'settings' );
                } );
            } else {
                // Insert default data then call _load again
                chrome.storage.local.set( {
                    'settings': {
                        'preview': true,
                        'mute': true,
                        'sounds': true,
                        'tabs': false
                    }
                }, _load );
            }
        } );
    }

    // Set up listener for when new clips are added
    chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
        // If message is settings, sync settings
        if( message.settings ) {
            // Do not sync if this service just sent a request
            if( sync )
                sync = false;
            else
                _load()
        }
    } );

    // Load when instantiated
    _load();

    // Return service API
    return {
        'get': _get,
        'set': _set
    };
} ] );
