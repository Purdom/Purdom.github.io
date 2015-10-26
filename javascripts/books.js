$(function() {
    'use strict';

    function bibframe(thing) {
        return "http://bibframe.org/vocab/" + thing;
    }

    function purdom(thing) {
        return "http://purdom.org/reading#" + thing;
    }

    function rdfs(thing) {
        return "http://www.w3.org/2000/01/rdf-schema#" + thing;
    }

    var personType = bibframe("Person");
    var workType   = bibframe("Work");
    var creator    = bibframe("creator");
    var leadTo     = purdom("lead_to");
    var label      = rdfs("label");

    function getTypeOf(obj) {
        var type = obj["@type"];
        return (type === undefined ? null : type[0]);
    }

    function getLabel(obj) {
        var l = obj[label];
        if (l === undefined || l === null) {
            l = obj["@id"];
            if (l === undefined || l === null) {
                l = "unknown";
            }
            l = "<" + l + ">";
        } else {
            l = l[0]["@value"];
        }
        return l;
    }

    function findType(typeName, triples) {
        return triples.filter(function(triple) {
            return getTypeOf(triple) === typeName;
        });
    }

    function indexById(triples) {
        var index = {};
        triples.forEach(function(obj) {
            var id = obj["@id"];
            index[id] = obj;
        });
        return index;
    }

    function findLeadTo(triples) {
        return triples.filter(function(obj) {
            return (obj[leadTo] !== undefined);
        });
    }

    function addPeopleSource(index, link) {
        if (getTypeOf(link.link) === personType) {
            link.source = link.link;
        } else {
            var source = (link.link[creator] || [])
                .map(function(obj) {
                    return index[obj["@id"]];
                });
            if (source.length === 0) {
                link.source = null;
            } else {
                link.source = source[0];
            }
        }
        return link;
    }

    function addPeopleTarget(index, link) {
        var targets = link.link[leadTo]
                .map(function(obj) {
                    return index[obj["@id"]];
                })
                .map(function(obj) {
                    var type = getTypeOf(obj);
                    var person = null;
                    if (type === personType) {
                        person = obj;
                    } else if (type === workType) {
                        var c = obj[creator];
                        if (c !== undefined && c !== null) {
                            person = index[c[0]["@id"]];
                        }
                    }
                    return person;
                })
            .filter(function(obj) { return obj !== null; })
        ;
        link.dest = targets;
        return link;
    }

    function pushNode(nodeIndex, nodes, obj) {
        var objId = obj["@id"];
        if (nodeIndex[objId] === undefined) {
            nodeIndex[objId] = nodes.length;
            nodes.push({
                id: objId,
                label: getLabel(obj),
                sourceCount: 0,
                destCount: 0
            });
        }
    }

    function buildPeopleGraph(people) {
        var nodes     = [],
            nodeIndex = {},
            links     = [];

        people.forEach(function(link) {
            if (link.source !== null) {
                pushNode(nodeIndex, nodes, link.source);
            }
            link.dest.forEach(function(dest) {
                pushNode(nodeIndex, nodes, dest);
            });
        });
        people.forEach(function(link) {
            if (link.source !== null) {
                var i = nodeIndex[link.source["@id"]];
                link.dest.forEach(function(dest) {
                    var j = nodeIndex[dest["@id"]];
                    nodes[i].sourceCount++;
                    nodes[j].destCount++;
                    links.push({
                        source: i,
                        target: j
                    });
                });
            }
        });

        return {nodes: nodes, links: links};
    }

    function graphPeople(divId, triples) {
        var width  = 960,
            height = 500;
        var force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height]);
        var svg = d3.select(divId).append("svg")
                .attr("width", width)
                .attr("height", height);
        var index = indexById(triples);
        var people = findLeadTo(triples)
                .map(function(obj) {
                    // source :: Triple
                    // link   :: Triple
                    // dest   :: Array Triple
                    return {source: null, link: obj, dest: null};
                })
                .map(function(obj) {
                    return addPeopleSource(index, obj);
                })
                .map(function(obj) {
                    return addPeopleTarget(index, obj);
                })
        ;
        var graph = buildPeopleGraph(people);
        var maxSourceCount = d3.max(graph.nodes, function(n) {
            return n.sourceCount;
        });
        var maxDestCount = d3.max(graph.nodes, function(n) {
            return n.destCount;
        });
        var colorF = function(obj) {
            return sourceDestColor(maxSourceCount, maxDestCount, obj);
        };

        forceDirected(
            $(divId), svg, graph, width, height, colorF, force
        );
    }

    function addBookSource(triples, link) {
        if (getTypeOf(link.link) == workType) {
            link.source = [link.link];
        } else {
            var source = [];
            triples.forEach(function(obj) {
                var c      = obj[creator],
                    linkId = link.link["@id"];
                if (c !== undefined && c[0]["@id"] === linkId) {
                    source.push(obj);
                }
            });
            link.source = source;
        }
        return link;
    }

    function addBookTarget(index, triples, link) {
        var targets = [];
        link.link[leadTo]
            .map(function(obj) {
                return index[obj["@id"]];
            })
            .forEach(function(obj) {
                var type = getTypeOf(obj);
                if (type == workType) {
                    targets.push(obj);
                } else {
                    var linkId = obj["@id"];
                    triples.forEach(function(t) {
                        var c = t[creator];
                        if (c !== undefined && c[0]["@id"] === linkId) {
                            targets.push(t);
                        }
                    });
                }
            })
        ;
        link.dest = targets;
        return link;
    }

    function buildBookGraph(books) {
        var nodes     = [],
            nodeIndex = {},
            links     = [];

        console.log('building book graph', books);
        books.forEach(function(link) {
            if (link.source !== null) {
                link.source.forEach(function(source) {
                    pushNode(nodeIndex, nodes, source);
                });
            }
            link.dest.forEach(function(dest) {
                pushNode(nodeIndex, nodes, dest);
            });
        });
        books.forEach(function(link) {
            link.source.forEach(function(source) {
                var i = nodeIndex[source["@id"]];
                link.dest.forEach(function(dest) {
                    var j = nodeIndex[dest["@id"]];
                    nodes[i].sourceCount++;
                    nodes[j].destCount++;
                    links.push({
                        source: i,
                        target: j
                    });
                });
            });
        });

        return {nodes: nodes, links: links};
    }

    function graphBooks(divId, triples) {
        var width  = 960,
            height = 500;
        var force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height]);
        var svg = d3.select(divId).append("svg")
                .attr("width", width)
                .attr("height", height);
        var index = indexById(triples);
        var books = findLeadTo(triples)
                .map(function(obj) {
                    return {source: null, link: obj, dest: null};
                })
                .map(function(obj) {
                    return addBookSource(triples, obj);
                })
                .map(function(obj) {
                    return addBookTarget(index, triples, obj);
                })
        ;
        console.log('books', books);
        var graph = buildBookGraph(books);
        var maxSourceCount = d3.max(graph.nodes, function(n) {
            return n.sourceCount;
        });
        var maxDestCount = d3.max(graph.nodes, function(n) {
            return n.destCount;
        });
        var colorF = function(obj) {
            return sourceDestColor(maxSourceCount, maxDestCount, obj);
        };

        forceDirected(
            $(divId), svg, graph, width, height, colorF, force
        );
    }

    function sourceDestColor(maxSource, maxDest, obj) {
        var saturation = 0.5 +
                (obj.sourceCount / maxSource) -
                (obj.destCount   / maxDest  );
        return d3.hsl(60, saturation, 0.4);
    }

    function forceDirected(parent, svg, graph, width, height, color, force) {
        force
            .nodes(graph.nodes)
            .links(graph.links)
            .start();
        var link = svg.selectAll(".link")
                .data(graph.links)
                .enter().append("line")
                .attr("class", "link")
                .style("stroke-width", 3)
        ;
        var node = svg.selectAll(".node")
                .data(graph.nodes)
                .enter().append("circle")
                .attr("class", "node")
                .attr("r", 15)
                .style("fill", color)
                .on('mouseover', function(obj) {
                    console.log(obj);
                    $(".selected", parent).text(
                        "" + obj.destCount +
                            " ❯ " + obj.label +
                            " ❯ " + obj.sourceCount
                    );
                })
                .call(force.drag);
        node.append("title")
            .text(function(d) { return d.label; })
        ;

        force.on("tick", function() {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; })
            ;
            node
                .attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
            ;
        });
    }

    window.bibframe = bibframe;
    window.purdom   = purdom;
    window.findType = findType;

    $.getJSON('/posts.json', function(data) {
        window.triples = data;
        jsonld.expand(data, function(err, expanded) {
            if (err !== null) {
                console.log('ERROR:', err);
            } else {
                window.expanded = expanded;
                graphPeople("#people", expanded);
                graphBooks("#books", expanded);
            }
        });
    });
});
