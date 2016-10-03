---
---

/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

const height       = 500;
const width        = 960;
const strokeWidth  = 3;
const radius       = 12;
const charge       = -400;
const linkDistance = 100;

// get posts.json
// pull influences according to what p's read.
withPostLD(expanded => {
  var gb = new GraphBuilder(expanded);
  window.gbuilder = gb;
  gb.buildNodes();
  gb.buildLinks();

  var gv = new GraphViewer(gb.nodes, gb.links);
  window.gviewer = gv;
  gv.init();
  gv.start();
});

class GraphBuilder {
  constructor(expanded) {
    this.nodes = [];
    this.links = [];

    this.s = byS(expanded);
    this.p = byP(expanded);
    this.o = byO(expanded);

    this.nodesSet = new Map();
    this.linksSet = new Map();
  }

  buildNodes() {
    this.p.get(creator).forEach(creatorP => {
      var objId        = creatorP[creator][0]["@id"],
          creatorNodes = this.s.get(objId);

      if (creatorNodes != null) {
        creatorNodes.forEach(node => this.addNode(node));
      }

    });
  }

  addNode(node) {
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

  buildLinks() {
    this.p.get(leadTo).forEach(source => {
      var subj = getCreator(this.s, source);
      // console.log('leadTo', source, subj);
      source[leadTo].forEach(this.buildTargets(subj));
    });
    this.p.get(inspiredBy).forEach(target => {
      var obj = getCreator(this.s, target);
      // console.log('inspiredBy', target, obj);
      target[inspiredBy].forEach(this.buildSources(obj));
    });
  }

  buildSources(obj) {
    var oId = obj["@id"];

    return sourceId => {
      var creatorId, subject, sId, link;
      var source = this.s.get(sourceId["@id"])[0];
      var sourceType = getTypeOf(source);
      // console.log('subject', sourceId, source);

      if (sourceType === bibframe("Work") ||
          sourceType === bibframe('BlogPost')) {
        creatorId = source[creator];
        if (creatorId == null) {
          return;
        }
        subject = this.s.get(creatorId[0]["@id"])[0];
      } else {
        subject = source;
      }

      sId = subject["@id"];
      if (sId === oId) {
        return;
      }

      if (!this.linkSeen(sId, oId)) {
        link = {
          source: this.addNode(subject),
          target: this.nodesSet.get(oId)
        };
        this.links.push(link);
        this.seeLink(sId, oId);
      }
    };
  }

  buildTargets(subject) {
    var sId = subject["@id"];

    return targetId => {
      var creatorId, obj, oId, link;
      var target = this.s.get(targetId["@id"])[0];
      // console.log('target', targetId, target);

      if (getTypeOf(target) === bibframe("Work")) {
        creatorId = target[creator];
        if (creatorId == null) {
          return;
        }
        obj = this.s.get(creatorId[0]["@id"])[0];
      } else {
        obj = target;
      }

      oId = obj["@id"];
      if (sId === oId) {
        return;
      }

      if (!this.linkSeen(sId, oId)) {
        link = {
          source: this.nodesSet.get(sId),
          target: this.nodesSet.get(oId)
        };
        this.links.push(link);
        this.seeLink(sId, oId);
      }
    };
  }

  seeLink(s, o) {
    if (!this.linksSet.has(s)) {
      this.linksSet.set(s, new Set());
    }
    this.linksSet.get(s).add(o);
  }

  linkSeen(s, o) {
    var sSet = this.linksSet.get(s);
    return sSet != undefined && sSet.has(o);
  }
}

function getCreator(sindex, obj) {
  var c;
  if (getTypeOf(obj) === bibframe('Work')) {
    c = sindex.get(obj[creator][0]["@id"])[0];
  } else {
    c = obj;
  }
  return c;
}

class GraphViewer {
  constructor(nodes, links) {
    this.nodes = nodes;
    this.links = links;
  }

  init() {
    this.force = d3.layout.force()
      .charge(charge)
      .linkDistance(linkDistance)
      .size([width, height]);
    this.svg = d3.select("#tree").append("svg")
      .attr("width", width)
      .attr("height", height);
  }

  start() {
    this.force
      .nodes(this.nodes)
      .links(this.links)
      .start();
    this.linkNodes = this.svg.selectAll('line')
      .data(this.links)
      .enter()
        .append("line")
        .classed({'link': true, 'read': true})
    ;
    this.nodeNodes = this.svg.selectAll('circle')
      .data(this.nodes)
      .enter()
        .append("circle")
        .classed({'node': true, 'read': true})
        .attr("r", radius)
        // .style("fill", color)
        // .on("mouseover", () => this.mouseover())
        .call(this.force.drag)
    ;
    this.nodeNodes.append("title")
      .text(d => getLabel(d));
    this.force.on("tick", () => this.tick());
  }

  tick() {
    this.linkNodes
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    this.nodeNodes
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
  }

  mouseover(obj) {
  }
}

