/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var height = 1024;
var width = 960;
var strokeWidth = 3;
var radius = 6;
var charge = -200;
var linkDistance = 40;

// get posts.json
// pull influences according to what p's read.
withPostLD(function (expanded) {
  var gb = new GraphBuilder(expanded);
  window.gbuilder = gb;
  gb.buildGraph();

  var gv = new GraphViewer(gb.nodes, gb.links);
  window.gviewer = gv;
  gv.init();
  gv.start();
});

var GraphBuilder = (function () {
  function GraphBuilder(expanded) {
    _classCallCheck(this, GraphBuilder);

    this.nodes = [];
    this.nodesSet = new Map();
    this.links = [];
    this.linksSet = new Map();

    this.s = byS(expanded);
    this.p = byP(expanded);
    this.o = byO(expanded);
  }

  _createClass(GraphBuilder, [{
    key: 'buildGraph',
    value: function buildGraph() {
      this.buildRead();
      this.buildInspiredByP();
      this.buildInspiredByDb();
    }
  }, {
    key: 'buildRead',
    value: function buildRead() {
      var _this = this;

      this.p.get(leadTo).forEach(function (node) {
        var subj = _this.getCreator(node);
        // console.log('leadTo', source, subj);
        node[leadTo].forEach(_this.buildLink(subj, 'source', 'target', 'reader'));
      });
    }
  }, {
    key: 'buildInspiredByP',
    value: function buildInspiredByP() {
      var _this2 = this;

      this.p.get(inspiredBy).forEach(function (node) {
        var obj = _this2.getCreator(node);
        // console.log('inspiredBy', target, obj);
        node[inspiredBy].forEach(_this2.buildLink(obj, 'target', 'source', 'reader', 'reader influenced'));
      });
    }
  }, {
    key: 'loadInfluencedBy',
    value: function loadInfluencedBy(fc, node) {
      this.loadDBPedia(fc, node, "influencedBy", "source", "writer influenced", "target", "writer influenced");
    }
  }, {
    key: 'loadInfluences',
    value: function loadInfluences(fc, node) {
      this.loadDBPedia(fc, node, "influenced", "source", "writer", "target", null);
    }
  }, {
    key: 'loadDBPedia',
    value: function loadDBPedia(fc, node, property, propa, clsa, propb, clsb) {
      var _this3 = this;

      var nid = node["@id"],
          propq = '?' + property,
          query = 'SELECT * { <' + nid + '> <' + dbo(property) + '> ' + propq + ' }',
          results = new ldf.SparqlIterator(query, { fragmentsClient: fc });
      // Get ID of those who influenced node (author already in the graph).
      results.on('data', function (row) {
        var infl = { "@id": row[propq] },
            q = 'SELECT * { <' + row[propq] + '> ?p ?o }',
            iter = new ldf.SparqlIterator(q, { fragmentsClient: fc });
        // Get all information about each influence.
        iter.on('data', _this3.accumulateNode(infl)).on('end', function () {
          // The infl's done. insert it into the graph with links
          jsonld.expand([infl], function (err, _ref) {
            var _ref2 = _slicedToArray(_ref, 1);

            var expanded = _ref2[0];

            if (err !== null) {
              console.log('ERROR', err);
            } else {
              console.log('It\'s all good.', expanded);
              var newNode = _this3.addNewNode(expanded, clsa),
                  nodes = [],
                  link,
                  newData;
              if (newNode.isNew) {
                nodes.push(_this3.nodes[newNode.index]);
              }

              link = _this3.addLink(expanded, node, propa, clsa, propb, clsb);
              newData = { nodes: nodes, link: link };

              if (newData.nodes.length > 0 && newData.link != null) {
                $('svg').trigger('updateData', [newData]);
                console.log('triggered updateData', _this3, [newData]);
              }
            }
          });
        });
      });
    }
  }, {
    key: 'accumulateNode',
    value: function accumulateNode(node) {
      var _this4 = this;

      return function (d) {
        // Build linked data node.
        var key = d["?p"],
            value;
        if (key === rdfType) {
          key = "@type";
          value = d["?o"];
        } else {
          value = _this4.parseValue(d["?o"]);
        }
        if (node[key] == null) {
          node[key] = [];
        }
        node[key].push(value);
      };
    }
  }, {
    key: 'parseValue',
    value: function parseValue(vString) {
      var splits;

      splits = vString.split('@');
      if (splits.length === 2) {
        return {
          '@value': splits[0].substr(1, splits[0].length - 2),
          '@language': splits[1]
        };
      }

      splits = vString.split('^^');
      if (splits.length === 2) {
        return {
          '@value': splits[0].substr(1, splits[0].length - 2),
          '@type': splits[1]
        };
      }

      return { '@id': vString };
    }
  }, {
    key: 'buildInspiredByDb',
    value: function buildInspiredByDb() {
      var _this5 = this;

      var fragmentsClient = new ldf.FragmentsClient('http://fragments.dbpedia.org/2015/en');

      this.nodes.forEach(function (n) {
        _this5.loadInfluencedBy(fragmentsClient, n);
        _this5.loadInfluences(fragmentsClient, n);
      });
    }
  }, {
    key: 'buildLink',
    value: function buildLink(a, propa, propb, clsa) {
      var _this6 = this;

      var clsb = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      var aid = a["@id"];

      return function (bnode) {
        var b = _this6.getCreator(_this6.s.get(bnode["@id"])[0]),
            bid = b["@id"];

        if (aid !== bid) {
          _this6.addLink(a, b, propa, clsa, propb, clsb, aid, bid);
        }
      };
    }
  }, {
    key: 'addLink',
    value: function addLink(a, b, propa, clsa, propb) {
      var clsb = arguments.length <= 5 || arguments[5] === undefined ? null : arguments[5];
      var aid = arguments.length <= 6 || arguments[6] === undefined ? null : arguments[6];
      var bid = arguments.length <= 7 || arguments[7] === undefined ? null : arguments[7];

      var link = null;

      clsb = clsb === null ? clsa : clsb;
      aid = aid === null ? a["@id"] : aid;
      bid = bid === null ? b["@id"] : bid;

      if (!this.linkSeen(aid, bid)) {
        link = {};
        link[propa] = this.addNode(a, clsa);
        link[propb] = this.addNode(b, clsb);
        link['@class'] = clsb;

        this.links.push(link);
        this.seeLink(aid, bid);
      }

      return link;
    }
  }, {
    key: 'addNewNode',
    value: function addNewNode(node, cls) {
      var i, isNew;
      var nodeId = node["@id"];

      if (this.nodesSet.has(nodeId)) {
        i = this.nodesSet.get(nodeId);
        isNew = false;
      } else {
        i = this.nodes.length;
        this.nodes.push(node);
        this.nodesSet.set(nodeId, i);
        if (cls !== null) {
          node["@class"] = cls;
        }
        isNew = true;
      }

      return { index: i, isNew: isNew };
    }
  }, {
    key: 'addNode',
    value: function addNode(node, cls) {
      return this.addNewNode(node, cls).index;
    }
  }, {
    key: 'seeLink',
    value: function seeLink(s, o) {
      var nodes = [s, o];
      nodes.sort();

      if (!this.linksSet.has(nodes[0])) {
        this.linksSet.set(nodes[0], new Set());
      }
      this.linksSet.get(nodes[0]).add(nodes[1]);
    }
  }, {
    key: 'linkSeen',
    value: function linkSeen(s, o) {
      var nodes = [s, o],
          sSet;
      nodes.sort();

      var sSet = this.linksSet.get(nodes[0]);
      return sSet != undefined && sSet.has(nodes[1]);
    }
  }, {
    key: 'getCreator',
    value: function getCreator(obj) {
      var t = getTypeOf(obj),
          c;

      if (isAny(obj, bibframe('Work'), bibframe('BlogPost')) && obj[creator] != null) {
        c = this.s.get(obj[creator][0]["@id"])[0];
      } else {
        c = obj;
      }

      return c;
    }
  }]);

  return GraphBuilder;
})();

var GraphViewer = (function () {
  function GraphViewer(nodes, links) {
    _classCallCheck(this, GraphViewer);

    this.nodes = nodes;
    this.links = links;
  }

  _createClass(GraphViewer, [{
    key: 'init',
    value: function init() {
      var _this7 = this;

      this.force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([width, height]);
      this.svg = d3.select("#tree").append("svg").attr("width", width).attr("height", height);
      this.svg.append('g').attr('id', 'links');
      this.svg.append('g').attr('id', 'nodes');

      this.force.nodes(this.nodes).links(this.links);
      this.linkNodes = this.svg.select('#links').selectAll('line');
      this.nodeNodes = this.svg.select('#nodes').selectAll('circle');

      this.force.on("tick", function () {
        return _this7.tick();
      });
      $("svg").on('updateData', function (ev, newData) {
        console.log('updateData', ev, newData);
        newData.nodes.forEach(function (n) {
          return _this7.nodes.push(n);
        });
        if (newData.link != null) {
          _this7.links.push(newData.link);
        }
        _this7.start();
      });
    }
  }, {
    key: 'start',
    value: function start() {
      this.linkNodes = this.linkNodes.data(this.links);
      this.linkNodes.enter().append("line").attr('class', function (d) {
        return 'link ' + d["@class"];
      });
      this.nodeNodes = this.nodeNodes.data(this.nodes);
      this.nodeNodes.enter().insert("circle").attr('class', function (d) {
        return 'node ' + d["@class"];
      }).attr("r", radius).append('title').text(function (d) {
        return getLabel(d);
      }).call(this.force.drag);

      this.force.start();
    }
  }, {
    key: 'tick',
    value: function tick() {
      this.linkNodes.attr("x1", function (d) {
        return d.source.x;
      }).attr("y1", function (d) {
        return d.source.y;
      }).attr("x2", function (d) {
        return d.target.x;
      }).attr("y2", function (d) {
        return d.target.y;
      });
      this.nodeNodes.attr("cx", function (d) {
        return d.x;
      }).attr("cy", function (d) {
        return d.y;
      });
    }
  }, {
    key: 'mouseover',
    value: function mouseover(obj) {}
  }]);

  return GraphViewer;
})();