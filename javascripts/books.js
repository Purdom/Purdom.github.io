$(function() {
    'use strict';

    $.getJSON('/posts.json', function(data) {
        window.triples = data;
        jsonld.expand(data, function(err, expanded) {
            if (err !== null) {
                console.log('ERROR:', err);
            } else {
                window.expanded = expanded;
            }
        });
    });
});
