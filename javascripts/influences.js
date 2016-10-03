/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var height = 600;
var width = 960;
var strokeWidth = 3;
var radius = 12;
var charge = -400;
var linkDistance = 100;

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
        node[leadTo].forEach(_this.buildLink(subj, 'source', 'target', 'read'));
      });
    }
  }, {
    key: 'buildInspiredByP',
    value: function buildInspiredByP() {
      var _this2 = this;

      this.p.get(inspiredBy).forEach(function (node) {
        var obj = _this2.getCreator(node);
        // console.log('inspiredBy', target, obj);
        node[inspiredBy].forEach(_this2.buildLink(obj, 'target', 'source', 'read', 'infl-purdom'));
      });
    }
  }, {
    key: 'buildInspiredByDb',
    value: function buildInspiredByDb() {}
  }, {
    key: 'buildLink',
    value: function buildLink(a, propa, propb, clsa) {
      var _this3 = this;

      var clsb = arguments.length <= 4 || arguments[4] === undefined ? null : arguments[4];

      clsb = clsb === null ? clsa : clsb;
      var aid = a["@id"];

      return function (bnode) {
        var b = _this3.getCreator(_this3.s.get(bnode["@id"])[0]),
            bid = b["@id"],
            link;

        if (aid === bid) {
          return;
        }

        if (!_this3.linkSeen(aid, bid)) {
          link = {};
          link[propa] = _this3.addNode(a, clsa);
          link[propb] = _this3.addNode(b, clsb);
          link['@class'] = clsb;

          _this3.links.push(link);
          _this3.seeLink(aid, bid);
        }
      };
    }
  }, {
    key: 'addNode',
    value: function addNode(node, cls) {
      var i;
      var nodeId = node["@id"];

      if (this.nodesSet.has(nodeId)) {
        i = this.nodesSet.get(nodeId);
      } else {
        i = this.nodes.length;
        this.nodes.push(node);
        this.nodesSet.set(nodeId, i);
        if (cls !== null) {
          node["@class"] = cls;
        }
      }

      return i;
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

      if ((t === bibframe('Work') || t === bibframe('BlogPost')) && obj[creator] != null) {
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
      this.force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([width, height]);
      this.svg = d3.select("#tree").append("svg").attr("width", width).attr("height", height);
    }
  }, {
    key: 'start',
    value: function start() {
      var _this4 = this;

      this.force.nodes(this.nodes).links(this.links).start();
      this.linkNodes = this.svg.selectAll('line').data(this.links).enter().append("line").attr('class', function (d) {
        return 'link ' + d["@class"];
      });
      this.nodeNodes = this.svg.selectAll('circle').data(this.nodes).enter().append("circle").attr('class', function (d) {
        return 'node ' + d["@class"];
      }).attr("r", radius)
      // .style("fill", color)
      // .on("mouseover", () => this.mouseover())
      .call(this.force.drag);
      this.nodeNodes.append("title").text(function (d) {
        return getLabel(d);
      });
      this.force.on("tick", function () {
        return _this4.tick();
      });
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