angular.module( 'twitch.clips.manager' ).controller( 'manager', [ '$scope', '$sce', '$timeout', 'clipboard', 'settingsStorage', function ( $scope, $sce, $timeout, clipboard, settingsStorage ) {
    // List of all clips
    $scope.clips = [];

    // Need reload flag
    var needsReload = false;

    // List of filtered clips
    $scope.filteredClips = [];

    // Set up filters
    $scope.filterBroadcaster = { 'options': [], 'property': 'casterName' };
    $scope.filterViewer = { 'options': [], 'property': 'viewerName' };
    $scope.filterGame = { 'options': [], 'property': 'game' };

    // Clip mute state
    $scope.muted = false;
    var muteNeedsSync = true;

    // Set up the sort options
    $scope.sortDescending = true;
    $scope.sortBy = {
        'options': [ {
            'value': 'timestamp',
            'label': 'Date Added'
        }, {
            'value': 'casterName',
            'label': 'Broadcaster'
        }, {
            'value': 'viewerName',
            'label': 'Viewer'
        }, {
            'value': 'game',
            'label': 'Game'
        } ]
    };

    // Default the sorting option
    $scope.sortBy.selected = $scope.sortBy.options[ 0 ];

    // Set up event listener for when the list should be re-filtered
    $scope.$on( 'filter', filterAndSort );

    // Set up event listener for when settings change
    $scope.$on( 'settings', function () {
        // If mute is not synced, sync it
        if( muteNeedsSync ) {
            $scope.muted = settingsStorage.get( 'mute' );
            muteNeedsSync = false;
        }
    } );

    // Watch for filter changes
    $scope.$watch( 'sortDescending', filterAndSort );
    $scope.$watch( 'sortBy.selected', filterAndSort );

    // Function to get a clip viewing link
    $scope.clipLink = function ( clip ) {
        return $sce.trustAsUrl( clip.link );
    };

    // Function to get the name of the user who took the clip
    $scope.viewer = function ( clip ) {
        return clip.viewerName;
    };

    // Function to get a link to the profile of the user who took the clip
    $scope.viewerLink = function ( clip ) {
        return $sce.trustAsUrl( 'https://www.twitch.tv/' + clip.viewerLogin );
    };

    // Function to get a clipraw video link
    $scope.videoLink = function ( clip ) {
        return $sce.trustAsResourceUrl( clip.video[ clip.video.length - 1 ].source );
    };

    // Function to get a clip thumbnail link
    $scope.thumbnailLink = function ( clip ) {
        return $sce.trustAsResourceUrl( clip.thumbnail );
    };

    // Function to get the name of the broadcaster the clip was taken of
    $scope.caster = function ( clip ) {
        return clip.casterName;
    };

    // Function to get a link to the profile of thebroadcaster the clip was taken of
    $scope.casterLink = function ( clip ) {
        return $sce.trustAsUrl( 'https://www.twitch.tv/' + clip.casterLogin );
    };

    // Function to get the title of the stream at the time the clip was taken
    $scope.title = function ( clip ) {
        return clip.title;
    };

    // Function to get the title of the game being played in the clip
    $scope.game = function ( clip ) {
        return clip.game;
    };

    // Function to get a clip download link
    $scope.downloadLink = function ( clip ) {
        return $sce.trustAsUrl( clip.video[ 0 ].source );
    };

    // Function to get the file download name for a clip
    $scope.downloadName = function ( clip ) {
        return clip.casterLogin + '-' + clip.id + '-by-' + clip.viewerLogin + '.mp4';
    };

    // Function to toggle mute state
    $scope.toggleMute = function () {
        $scope.muted = !$scope.muted;
    };

    // Function to get the mute button icon
    $scope.muteIcon = function () {
        return {
            'icon-volume-high': !$scope.muted,
            'icon-volume-mute2': $scope.muted
        };
    }

    // Function to copy the clip link to the clipboard
    $scope.copyClipLink = function ( clip ) {
        clipboard.copy( $scope.clipLink( clip ) );
    };

    // Function to delete an entry
    $scope.deleteClip = function ( clip ) {
        // Find the index of this clip
        var index = $scope.clips.indexOf( clip );

        // If the clip exists, remove it and re-filter
        if( index >= 0 ) {
            // Remove the entry
            $scope.clips.splice( index, 1 );

            // Re-filter the data
            filterAndSort();

            // Notify of deletion
            $scope.$emit( 'notification', 'Clip Deleted' );

            // Copy data and remove $$hashkey
            var data = [];
            for( var i = 0; i < $scope.clips.length; i++ ) {
                // Deep copy the object
                var copy = angular.copy( $scope.clips[ i ] );
                // Remove the $$hashKey entry
                delete copy[ '$$hashKey' ];
                // Add it to the data
                data.push( copy );
            }

            // Save the data
            chrome.storage.local.set( { 'clips': data }, function () {} );
        }
    };

    // Function to get the current sort direction icon
    $scope.sortDirection = function () {
        return {
            'icon-sort-alpha-asc': $scope.sortDescending,
            'icon-sort-alpha-desc': !$scope.sortDescending
        };
    };

    // Function to toggle the sort direction
    $scope.toggleSortDirection = function () {
        $scope.sortDescending = !$scope.sortDescending;
    };


    // Function to reload the clips from the data store
    function loadClips() {
        // Get clips from local storage
        chrome.storage.local.get( 'clips', function ( data ) {
            // Only process if clips found
            if( data.clips ) {
                // Copy over the data
                $scope.clips = data.clips;

                // Filter and sort
                filterAndSort();

                // Force a digest
                $scope.$digest();
            }
        } );
    }

    // Function to add or merge filters
    function addOrMergeFilters( filter, options ) {
        // Map the old options
        var old = {};
        for( var i = 0; i < filter.options.length; i++ ) {
            if( filter.options[ i ].enabled )
                old[ filter.options[ i ].value ] = true;
        }

        // Sort the new options
        options.sort();

        // Build a new option set
        filter.options = [];
        for( var i = 0; i < options.length; i++ ) {
            filter.options.push( {
                'value': options[ i ],
                'enabled': old[ options[ i ] ] ? true : false
            } );
        }
    }

    // Function to enumerate all of a given property
    function enumerateProperty( list, property ) {
        var map = {};

        // Iterate through the list and insert properties into the map
        for( var i = 0; i < list.length; i++ )
            map[ list[ i ][ property ] ] = true;

        // Return a list of keys
        return Object.keys( map );
    }

    // Function to filter and sort
    function filterAndSort() {
        // Setup filter options
        addOrMergeFilters( $scope.filterBroadcaster, enumerateProperty( $scope.clips, $scope.filterBroadcaster.property ) );
        addOrMergeFilters( $scope.filterViewer, enumerateProperty( $scope.clips, $scope.filterViewer.property ) );
        addOrMergeFilters( $scope.filterGame, enumerateProperty( $scope.clips, $scope.filterGame.property ) );

        // Apply all filters
        $scope.filteredClips = $scope.clips;
        $scope.filteredClips = filterList( $scope.filteredClips, $scope.filterBroadcaster );
        $scope.filteredClips = filterList( $scope.filteredClips, $scope.filterViewer );
        $scope.filteredClips = filterList( $scope.filteredClips, $scope.filterGame );

        // Sort the clips
        $scope.filteredClips.sort( function ( a, b ) {
            // check if numerical or alphabetical sort
            var sort = $scope.sortBy.selected;
            if( sort.value === 'timestamp' ) {
                // Check if ascending or descending
                if( $scope.sortDescending )
                    return a[ sort.value ] - b[ sort.value ];
                else
                    return b[ sort.value ] - a[ sort.value ];
            } else {
                // Check if ascending or descending
                if( $scope.sortDescending )
                    return a[ sort.value ].localeCompare( b[ sort.value ] );
                else
                    return b[ sort.value ].localeCompare( a[ sort.value ] );
            }
        } );
    }

    // Function to filter a list by the given filter
    function filterList( list, filter ) {
        // Make a new list to hold the filtered in options
        var kept = [];

        // Enumarete active options to check against
        var options = getActiveFilterMap( filter );

        // If options = false, do not filter
        if( !options )
            return list;

        // Check all options
        for( var i = 0; i < list.length; i++ ) {
            if( options[ list[ i ][ filter.property ] ] )
                kept.push( list[ i ] );
        }

        // Return the kept options
        return kept;
    }

    // Function to get only the active filters in a filter as a map
    function getActiveFilterMap( filter ) {
        var map = {};
        var added = false;

        // Iterate over options
        for( var i = 0; i < filter.options.length; i++ ) {
            // Check if the option is enabled
            if( filter.options[ i ].enabled ) {
                map[ filter.options[ i ].value ] = true;
                added = true;
            }
        }

        // If options found return map, otherwise false
        if( added )
            return map;
        else
            return false;
    }

    // Set up listener for when new clips are added
    chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
        // If message is a clip, add it
        if( message.clip ) {
            // If page is visible, load immediately
            if( !document.hidden )
                $timeout( loadClips );
            else {
                // Flag as needing reload
                needsReload = true;
            }
        }
    } );

    // Set up listener for visibility change events
    $( document ).on( 'visibilitychange', function () {
        // If document becomes visible and we need a reload, reload
        if( !document.hidden && needsReload ) {
            // Reload clips
            $timeout( loadClips );

            // Flag and no longer needing reload
            needsReload = false;
        }
    } )

    // Load clips on controller load
    loadClips();
} ] );
