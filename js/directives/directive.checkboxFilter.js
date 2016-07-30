angular.module( 'twitch.clips.manager' ).directive( 'checkboxFilter', [ '$compile', function ( $compile ) {
    // The filter area template
    var template = '' +
        '<div class="filters-container">' +
        '   <div class="wrapper" ng-repeat="option in checkboxFilter.options">' +
        '       <input type="checkbox" id="{{::checkboxFilter.property}}_{{::option.value}}" ng-model="option.enabled" ng-change="onChange()" />' +
        '       <label for="{{::checkboxFilter.property}}_{{::option.value}}"><span>{{::option.value}}</span></label>' +
        '   </div>' +
        '</div>';

    return {
        restrict: 'A',
        scope: {
            checkboxFilter: '='
        },
        controller: function ( $scope ) {
            // Function to handle when a filter setting is changed
            $scope.onChange = function () {
                // Emit re-filter event
                $scope.$emit( 'filter' );
            };
        },
        link: function ( scope, element, attrs ) {
            // Get elements
            var toggle = $( element );
            var container = $( template );
            var body = $( document.body );

            // Move container to body
            container.remove();
            body.append( $compile( container )( scope ) );

            // State tracking variables
            var open = false;

            // Default to out of view
            moveFiltersOut();

            // Set up listeners for when mouse enters the toggle button
            toggle.on( 'mouseenter', openFilter );
            toggle.on( 'mouseleave', closeFilter );
            container.on( 'mouseenter', openFilter );
            container.on( 'mouseleave', closeFilter );
            container.on( 'transitionend', moveFiltersOut );


            // Function to open the filters
            function openFilter() {
                // Flag as open
                open = true;

                // Add open classes
                toggle.addClass( 'active' );
                container.addClass( 'active' );

                // Find the y position for the filters
                y = toggle.offset().top + toggle.outerHeight();

                // Move the filter down into position
                container.css( 'top', y );

                // Move it to the front
                container.css( 'z-index', 250 );
            }

            // Function to close the filters
            function closeFilter() {
                // Flag as closed
                open = false;

                // Remove open classes
                toggle.removeClass( 'active' );
                container.removeClass( 'active' );

                // Move it back a little
                container.css( 'z-index', 200 );
            }

            // Function to move the filters out of view
            function moveFiltersOut() {
                // If the filter is not open, move it out of view
                if( !open )
                    container.css( 'top', -1000 );
            }

        }
    };
} ] );
