angular.module( 'twitch.clips.manager' ).controller( 'settings', [ '$scope', 'settingsStorage', function ( $scope, settingsStorage ) {
    // Settings state buffer
    $scope.settings = {
        'preview': false,
        'mute': false,
        'sounds': false,
        'tabs': false
    };

    // Listen for initial settings load/change
    $scope.$on( 'settings', function () {
        // Sync settings state from settingsStorage
        for( var setting in $scope.settings )
            $scope.settings[ setting ] = settingsStorage.get( setting );
    } );

    // Function to check if the setting is loaded yet
    $scope.isLoaded = function ( name ) {
        return settingsStorage.get( name ) !== null;
    };

    // Function to handle when a settings option is changed
    $scope.change = function ( name ) {
        settingsStorage.set( name, $scope.settings[ name ] );
    }
} ] );
