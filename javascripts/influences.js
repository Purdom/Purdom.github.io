/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var height = 500;
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
  gb.buildNodes();
  gb.buildLinks();

  var gv = new GraphViewer(gb.nodes, gb.links);
  window.gviewer = gv;
  gv.init();
  gv.start();
});

var GraphBuilder = (function () {
  function GraphBuilder(expanded) {
    _classCallCheck(this, GraphBuilder);

    this.nodes = [];
    this.links = [];

    this.s = byS(expanded);
    this.p = byP(expanded);
    this.o = byO(expanded);

    this.nodesSet = new Map();
    this.linksSet = new Map();
  }

  _createClass(GraphBuilder, [{
    key: "buildNodes",
    value: function buildNodes() {
      var _this = this;

      this.p.get(creator).forEach(function (creatorP) {
        var objId = creatorP[creator][0]["@id"],
            creatorNodes = _this.s.get(objId);

        if (creatorNodes != null) {
          creatorNodes.forEach(function (node) {
            return _this.addNode(node);
          });
        }
      });
    }
  }, {
    key: "addNode",
    value: function addNode(node) {
      var i;
      var nodeId = node["@id"];
      if (!this.nodesSet.has(nodeId)) {
        i = this.nodes.length;
        this.nodes.push(node);
        this.nodesSet.set(nodeId, i);
      } else {
        i = this.nodesSet.get(nodeId);
      }
      return i;
    }
  }, {
    key: "buildLinks",
    value: function buildLinks() {
      var _this2 = this;

      this.p.get(leadTo).forEach(function (source) {
        var subj = getCreator(_this2.s, source);
        // console.log('leadTo', source, subj);
        source[leadTo].forEach(_this2.buildTargets(subj));
      });
      this.p.get(inspiredBy).forEach(function (target) {
        var obj = getCreator(_this2.s, target);
        // console.log('inspiredBy', target, obj);
        target[inspiredBy].forEach(_this2.buildSources(obj));
      });
    }
  }, {
    key: "buildSources",
    value: function buildSources(obj) {
      var _this3 = this;

      var oId = obj["@id"];

      return function (sourceId) {
        var creatorId, subject, sId, link;
        var source = _this3.s.get(sourceId["@id"])[0];
        var sourceType = getTypeOf(source);
        // console.log('subject', sourceId, source);

        if (sourceType === bibframe("Work") || sourceType === bibframe('BlogPost')) {
          creatorId = source[creator];
          if (creatorId == null) {
            return;
          }
          subject = _this3.s.get(creatorId[0]["@id"])[0];
        } else {
          subject = source;
        }

        sId = subject["@id"];
        if (sId === oId) {
          return;
        }

        if (!_this3.linkSeen(sId, oId)) {
          link = {
            source: _this3.addNode(subject),
            target: _this3.nodesSet.get(oId)
          };
          _this3.links.push(link);
          _this3.seeLink(sId, oId);
        }
      };
    }
  }, {
    key: "buildTargets",
    value: function buildTargets(subject) {
      var _this4 = this;

      var sId = subject["@id"];

      return function (targetId) {
        var creatorId, obj, oId, link;
        var target = _this4.s.get(targetId["@id"])[0];
        // console.log('target', targetId, target);

        if (getTypeOf(target) === bibframe("Work")) {
          creatorId = target[creator];
          if (creatorId == null) {
            return;
          }
          obj = _this4.s.get(creatorId[0]["@id"])[0];
        } else {
          obj = target;
        }

        oId = obj["@id"];
        if (sId === oId) {
          return;
        }

        if (!_this4.linkSeen(sId, oId)) {
          link = {
            source: _this4.nodesSet.get(sId),
            target: _this4.nodesSet.get(oId)
          };
          _this4.links.push(link);
          _this4.seeLink(sId, oId);
        }
      };
    }
  }, {
    key: "seeLink",
    value: function seeLink(s, o) {
      if (!this.linksSet.has(s)) {
        this.linksSet.set(s, new Set());
      }
      this.linksSet.get(s).add(o);
    }
  }, {
    key: "linkSeen",
    value: function linkSeen(s, o) {
      var sSet = this.linksSet.get(s);
      return sSet != undefined && sSet.has(o);
    }
  }]);

  return GraphBuilder;
})();

function getCreator(sindex, obj) {
  var c;
  if (getTypeOf(obj) === bibframe('Work')) {
    c = sindex.get(obj[creator][0]["@id"])[0];
  } else {
    c = obj;
  }
  return c;
}

var GraphViewer = (function () {
  function GraphViewer(nodes, links) {
    _classCallCheck(this, GraphViewer);

    this.nodes = nodes;
    this.links = links;
  }

  _createClass(GraphViewer, [{
    key: "init",
    value: function init() {
      this.force = d3.layout.force().charge(charge).linkDistance(linkDistance).size([width, height]);
      this.svg = d3.select("#tree").append("svg").attr("width", width).attr("height", height);
    }
  }, {
    key: "start",
    value: function start() {
      var _this5 = this;

      this.force.nodes(this.nodes).links(this.links).start();
      this.linkNodes = this.svg.selectAll('line').data(this.links).enter().append("line").classed({ 'link': true, 'read': true });
      this.nodeNodes = this.svg.selectAll('circle').data(this.nodes).enter().append("circle").classed({ 'node': true, 'read': true }).attr("r", radius)
      // .style("fill", color)
      // .on("mouseover", () => this.mouseover())
      .call(this.force.drag);
      this.nodeNodes.append("title").text(function (d) {
        return getLabel(d);
      });
      this.force.on("tick", function () {
        return _this5.tick();
      });
    }
  }, {
    key: "tick",
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
    key: "mouseover",
    value: function mouseover(obj) {}
  }]);

  return GraphViewer;
})();