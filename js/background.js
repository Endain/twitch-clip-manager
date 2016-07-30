// Keep cache of the plugin settings
var settings = {};

// Check if storage was initialized, if not - initialize it
chrome.storage.local.get( 'clips', function ( data ) {
    // If no clips array, ad it and save it
    if( !data.clips )
        chrome.storage.local.set( { 'clips': [] }, function () {} );
} );

// Set up handler for browser action click
chrome.browserAction.onClicked.addListener( function ( tab ) {
    chrome.tabs.create( {
        'url': chrome.extension.getURL( 'html/clips.html' ),
        'selected': true
    } );
} );

// Set up the interceptor to grab new clips
chrome.webRequest.onBeforeRedirect.addListener( function ( details ) {
    // Add the clip to the clip store
    addClip( details.redirectUrl );

    // If auto-close is enabled, close the tabs
    if( settings.tabs === true )
        chrome.tabs.remove( details.tabId );
}, {
    'urls': [ 'https://clips.twitch.tv/clips' ]
} );

// Set up listener for when new clips are added
chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
    // If message is settings reload settings
    if( message.settings )
        load();
} );

// Set up listener for when new clips are added
chrome.runtime.onMessage.addListener( function ( message, sender, sendResponse ) {
    // If message is add clip, verify and then add it
    if( message.add )
        addClip( message.add, sendResponse );

    // Return true to flag async response
    return true;
} );


// Function to load the extension settings
function load() {
    chrome.storage.local.get( 'settings', function ( data ) {
        // If data found, load it, otherwise insert default data
        if( data && data.settings ) {
            // Store data to settings object
            settings = data.settings;
        } else {
            // Insert default data then call load again
            chrome.storage.local.set( {
                'settings': {
                    'preview': true,
                    'mute': true,
                    'sounds': true,
                    'tabs': false
                }
            }, load );
        }
    } );
}

// Function to get clip info and save it to the data store
function addClip( url, callback ) {
    // First fetch the clip data
    fetchClip( url, function ( details ) {
        // Store the extracted clip into the data store
        saveClip( details, callback );
    }, function () {
        // Could not find or get clip, if callback given, call it
        if( typeof callback === 'function' )
            callback( { 'notification': 'Clip Not Found' } );
    } );
}

// Function to fetch clip data from twitch
function fetchClip( url, success, error ) {
    // Make a new HTTP request
    var req = new XMLHttpRequest();

    // Set up callbacks for when req completes or fails
    req.addEventListener( "error", error );
    req.addEventListener( "abort", error );
    req.addEventListener( "load", function ( response ) {
        if( req.status === 200 ) {
            if( success && typeof success === 'function' )
                return success( parseClipPage( url, req.response ) );
        } else {
            if( error && typeof error === 'function' )
                return error();
        }
    } );

    // Fire off the request
    req.open( "GET", url );
    req.send();
}

// Function to parse a clip page for clip metadata
function parseClipPage( url, raw ) {
    var game = new RegExp( '(game.*?"(.*?)",)', 'g' );
    var title = new RegExp( '(channel_title.*?"(.*?)",)', 'g' );
    var casterLogin = new RegExp( '(broadcaster_login.*?"(.*?)",)', 'g' );
    var casterName = new RegExp( '(broadcaster_display_name.*?"(.*?)",)', 'g' );
    var viewerLogin = new RegExp( '(curator_login.*?"(.*?)",)', 'g' );
    var viewerName = new RegExp( '(curator_display_name.*?"(.*?)",)', 'g' );
    var video = new RegExp( '(source":.*?"(.*?)"})', 'g' );
    var thumbnail = new RegExp( '(og:image" content=.*"(.*)")', 'g' );
    var id = new RegExp( '(slug.*?"(.*?)",)', 'g' );

    return {
        'game': game.exec( raw )[ 2 ],
        'title': title.exec( raw )[ 2 ],
        'casterLogin': casterLogin.exec( raw )[ 2 ],
        'casterName': casterName.exec( raw )[ 2 ],
        'viewerLogin': viewerLogin.exec( raw )[ 2 ],
        'viewerName': viewerName.exec( raw )[ 2 ],
        'video': video.exec( raw )[ 2 ].replace( /\\/g, '' ),
        'thumbnail': thumbnail.exec( raw )[ 2 ],
        'id': id.exec( raw )[ 2 ],
        'link': url,
        'timestamp': Date.now()
    };
}

// Function to add clip metadata to the saved clips
function saveClip( details, callback ) {
    // Load the existing clips
    chrome.storage.local.get( 'clips', function ( data ) {
        var clips = data.clips;

        // Make sure the clip does not already exist
        for( var i = 0; i < clips.length; i++ ) {
            if( clips[ i ].casterLogin === details.casterLogin && clips[ i ].id === details.id )
                return;
        }

        // Add the clip to the data store
        clips.push( details );

        // Write the changes back
        chrome.storage.local.set( { 'clips': clips }, function () {
            // When done, notify that data changed
            chrome.runtime.sendMessage( { 'clip': details }, function () {} );

            // Play an icon animation to indicate save
            animateIcon();

            // Play a sound effect if sounds are on
            if( settings.sounds === true ) {
                var sound = new Audio( '/audio/clip.mp3' );
                sound.volume = 0.75;
                sound.play();
            }

            // If callback given, call it
            if( typeof callback === 'function' )
                callback( { 'notification': 'Clip Added' } );
        } );
    } );
}

// Function to generate an icon with color between white (0) and twitch purple (1)
function generateIconSVG( pct ) {
    var saturation = 43.5;
    var lightness = 45.1;

    // Adjust sat/brightness by pct
    var saturation = saturation * pct;
    var lightness = lightness + ( ( 100 - lightness ) * ( 1 - pct ) );

    // Generate svg string
    var svg = '';
    svg += '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="6 5 18 18">';
    svg += '    <path d="M14.802 7.804l-3.83 1.026 2.928 2.321 3.83-1.026-2.928-2.321zm2.895-.776l3.981-1.067.777 2.898-1.83.49-2.928-2.321zM7.969 9.635l-1.745.467L7 13l3.898-1.044-2.929-2.321zM7 13h16v9H7v-9zm1.969 3h2.785l2.228-3h-2.785l-2.228 3zm7.018 0h2.785L21 13h-2.785l-2.228 3z" fill-rule="evenodd" fill="hsl(261,' + saturation + '%,' + lightness + '%)"></path>';
    svg += '</svg>';

    return svg;
}

// Function to update icon
function updateIcon( color, scale ) {
    // Get SVG base64
    var svg64 = btoa( generateIconSVG( color ) );
    var b64Start = 'data:image/svg+xml;base64,';
    var image64 = b64Start + svg64;

    // Make a new image to draw
    var img = new Image();
    img.addEventListener( "load", function () {
        var w = 19;
        var h = 19;

        // Draw current icon
        ctx.save();
        ctx.clearRect( 0, 0, 19, 19 );
        ctx.translate( w / 2, h / 2 );
        ctx.scale( scale, scale );
        ctx.translate( -w / 2, -h / 2 );
        ctx.drawImage( img, 0, 0, 19, 19 );
        ctx.restore();

        // Update extension icon
        chrome.browserAction.setIcon( {
            imageData: ctx.getImageData( 0, 0, 19, 19 )
        } );
    }, false );

    // Set the source
    img.src = image64;
}

// Function to draw the icon in its default state
function drawDefaultIcon() {
    updateIcon( 1, 0.9 );
}

// Function to animate the extension icon
function animateIcon() {
    var pct = 0;
    var step = 0.05;

    nextFrame();

    // Draw the next frame
    function nextFrame() {
        // Calculate icon state
        var color = 1 - ( Math.sin( pct * Math.PI ) * 0.6 );
        var scale = 0.9 + ( Math.sin( pct * Math.PI ) * 0.14 );

        // Draw the icon
        updateIcon( color, scale );

        // Update progress
        pct += step;

        // Queue next frame if needed, otherwise default icon
        if( pct < 1 )
            setTimeout( nextFrame, 16 );
        else
            drawDefaultIcon();
    }
}


var canvas = document.createElement( 'canvas' );
var ctx = canvas.getContext( '2d' );

canvas.id = "icon";
canvas.width = 19;
canvas.height = 19;

document.getElementsByTagName( "body" )[ 0 ].appendChild( canvas );


// Initial extension startup
drawDefaultIcon();
load();
