/*
 * Photo Gallery Scripts.
 */

$(document).ready(function() {

    // Get the photos container and set that in a variable to use elsewhere.
    var $photos = $('#photos');

    // Hide photos container to avoid flicker of unstyled content.
    $photos.hide();

    // Use ImagesLoaded plugin to see if all the gallery images have loaded.
    $photos.imagesLoaded(function() {

        // Run Isotope on the photo gallery divs.
        $photos.isotope({
            itemSelector: 'div'
        });
    });

    // Fade in photos container, hopefully after Isotope has had a chance to
    // redo the images layout.
    $photos.fadeIn(600);
});

