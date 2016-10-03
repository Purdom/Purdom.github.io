---
---

/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

const height       = 600;
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
  gb.buildGraph();

  var gv = new GraphViewer(gb.nodes, gb.links);
  window.gviewer = gv;
  gv.init();
  gv.start();
});

class GraphBuilder {
  constructor(expanded) {
    this.nodes    = [];
    this.nodesSet = new Map();
    this.links    = [];
    this.linksSet = new Map();

    this.s = byS(expanded);
    this.p = byP(expanded);
    this.o = byO(expanded);
  }

  buildGraph() {
    this.buildRead();
    this.buildInspiredByP();
    this.buildInspiredByDb();
  }

  buildRead() {
    this.p.get(leadTo).forEach(node => {
      var subj = this.getCreator(node);
      // console.log('leadTo', source, subj);
      node[leadTo].forEach(this.buildLink(subj, 'source', 'target', 'read'));
    });
  }

  buildInspiredByP() {
    this.p.get(inspiredBy).forEach(node => {
      var obj = this.getCreator(node);
      // console.log('inspiredBy', target, obj);
      node[inspiredBy].forEach(
        this.buildLink(obj, 'target', 'source', 'read', 'infl-purdom')
      );
    });
  }

  buildInspiredByDb() {
  }

  buildLink(a, propa, propb, clsa, clsb=null) {
    clsb = clsb === null ? clsa : clsb;
    var aid = a["@id"];

    return bnode => {
      var b   = this.getCreator(this.s.get(bnode["@id"])[0]),
          bid = b["@id"],
          link;

      if (aid === bid) {
        return;
      }

      if (!this.linkSeen(aid, bid)) {
        link           = {};
        link[propa]    = this.addNode(a, clsa);
        link[propb]    = this.addNode(b, clsb);
        link['@class'] = clsb;

        this.links.push(link);
        this.seeLink(aid, bid);
      }
    };
  }

  addNode(node, cls) {
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

  seeLink(s, o) {
    var nodes = [s, o];
    nodes.sort();

    if (!this.linksSet.has(nodes[0])) {
      this.linksSet.set(nodes[0], new Set());
    }
    this.linksSet.get(nodes[0]).add(nodes[1]);
  }

  linkSeen(s, o) {
    var nodes = [s, o], sSet;
    nodes.sort();

    var sSet = this.linksSet.get(nodes[0]);
    return sSet != undefined && sSet.has(nodes[1]);
  }

  getCreator(obj) {
    var t = getTypeOf(obj),
        c;

    if ((t === bibframe('Work') || t === bibframe('BlogPost')) &&
        obj[creator] != null) {
        c = this.s.get(obj[creator][0]["@id"])[0];
      } else {
        c = obj;
      }

    return c;
  }

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
        .attr('class', d => `link ${d["@class"]}`)
    ;
    this.nodeNodes = this.svg.selectAll('circle')
      .data(this.nodes)
      .enter()
        .append("circle")
        .attr('class', d => `node ${d["@class"]}`)
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

