$(function() {
    'use strict';

    function bibframe(thing) {
        return "http://bibframe.org/vocab/" + thing;
    }

    function findType(typeName, triples) {
        return triples.filter(function(triple) {
            var type = triple["@type"];
            return (type !== undefined && type[0] == typeName);
        });
    }

    function findId(targetId, triples) {
        var hits = triples.filter(function(triple) {
            var id = triple["@id"];
            return (id === targetId);
        });
        return (hits.length > 0 ? hits[0] : null);
    }

    function findLinksBetween(typeName, triples) {

    }

    function graphPeople(divId, triples) {
        var width  = 960,
            height = 500;
        var color = d3.scale.category20();
        var force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height]);
        var svg = d3.select(divId).append("svg")
                .attr("width", width)
                .attr("height", height);
        var people = findType(bibframe("Person"), triples);

        force
            .nodes(people)
            .links(_)
            .start();
    }

    window.bibframe = bibframe;
    window.findType = findType;
    window.findId   = findId;

    $.getJSON('/posts.json', function(data) {
        window.triples = data;
        jsonld.expand(data, function(err, expanded) {
            if (err !== null) {
                console.log('ERROR:', err);
            } else {
                window.expanded = expanded;
                graphPeople("#people", expanded);
            }
        });
    });
});
