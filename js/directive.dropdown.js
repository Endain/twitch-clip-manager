angular.module( 'twitch.clips.manager' ).directive( 'dropdown', [ '$compile', function ( $compile ) {
    // The filter area template
    var template = '' +
        '<div class="dropdown-container">' +
        '   <div class="option" ng-repeat="option in dropdown.options" ng-class="optionClasses(option)" ng-click="select(option)">' +
        '       {{optionLabel(option)}}' +
        '   </div>' +
        '</div>';

    return {
        restrict: 'A',
        scope: {
            dropdown: '='
        },
        controller: function ( $scope ) {
            // Function to select the given option
            $scope.select = function(option) {
                $scope.dropdown.selected = option;
            };

            // Function to get the label for an option
            $scope.optionLabel = function ( option ) {
                return option.label;
            };

            // Function to get the classes to apply to an options
            $scope.optionClasses = function ( option ) {
                return {
                    'active': ( $scope.dropdown.selected === option )
                };
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
            moveDropdownOut();

            // Set up listeners for when mouse enters the toggle button
            toggle.on( 'mouseenter', openDropdown );
            toggle.on( 'mouseleave', closeDropdown );
            container.on( 'mouseenter', openDropdown );
            container.on( 'mouseleave', closeDropdown );
            container.on( 'transitionend', moveDropdownOut );


            // Function to open the dropdown
            function openDropdown() {
                // Flag as open
                open = true;

                // Add open classes
                toggle.addClass( 'active' );
                container.addClass( 'active' );

                // Find the y position for the filters
                var x = toggle.offset().left;
                var y = toggle.offset().top + toggle.outerHeight();
                var w = toggle.outerWidth()

                // Move the filter down into position
                container.css( 'left', x );
                container.css( 'top', y );
                container.css( 'width', w );

                // Move it to the front
                container.css( 'z-index', 250 );
            }

            // Function to close the dropdown
            function closeDropdown() {
                // Flag as closed
                open = false;

                // Remove open classes
                toggle.removeClass( 'active' );
                container.removeClass( 'active' );

                // Move it back a little
                container.css( 'z-index', 200 );
            }

            // Function to move the dropdown out of view
            function moveDropdownOut() {
                // If the filter is not open, move it out of view
                if( !open )
                    container.css( 'top', -1000 );
            }

        }
    };
} ] );
