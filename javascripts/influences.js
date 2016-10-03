---
---

/*
 * Legend:
 * - dark green  = those P's read;
 * - light green = influenced-by according to dbpedia;
 * - orange      = influenced-by for P's reading.
 */

const height       = 1024;
const width        = 960;
const strokeWidth  = 3;
const radius       = 6;
const charge       = -200;
const linkDistance = 40;

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
      node[leadTo].forEach(this.buildLink(subj, 'source', 'target', 'reader'));
    });
  }

  buildInspiredByP() {
    this.p.get(inspiredBy).forEach(node => {
      var obj = this.getCreator(node);
      // console.log('inspiredBy', target, obj);
      node[inspiredBy].forEach(
        this.buildLink(obj, 'target', 'source', 'reader', 'reader influenced')
      );
    });
  }

  loadInfluencedBy(fc, node) {
    this.loadDBPedia(
      fc, node, "influencedBy",
      "source", "writer influenced",
      "target", "writer influenced"
    );
  }

  loadInfluences(fc, node) {
    this.loadDBPedia(
      fc, node, "influenced",
      "source", "writer",
      "target", null
    );
  }

  loadDBPedia(fc, node, property, propa, clsa, propb, clsb) {
    var nid     = node["@id"],
        propq   = `?${property}`,
        query   = `SELECT * { <${nid}> <${dbo(property)}> ${propq} }`,
        results = new ldf.SparqlIterator(query, {fragmentsClient: fc});
    // Get ID of those who influenced node (author already in the graph).
    results.on('data', row => {
      var infl = {"@id": row[propq]},
          q    = `SELECT * { <${row[propq]}> ?p ?o }`,
          iter = new ldf.SparqlIterator(q, {fragmentsClient: fc});
      // Get all information about each influence.
      iter
        .on('data', this.accumulateNode(infl))
        .on('end', () => {
          // The infl's done. insert it into the graph with links
          jsonld.expand([infl], (err, [expanded]) => {
            if (err !== null) {
              console.log('ERROR', err);
            } else {
              console.log('It\'s all good.', expanded);
              var newNode = this.addNewNode(expanded, clsa),
                  nodes   = [],
                  link, newData;
              if (newNode.isNew) {
                nodes.push(this.nodes[newNode.index]);
              }

              link = this.addLink(expanded, node, propa, clsa, propb, clsb);
              newData = {nodes: nodes, link: link};

              if (newData.nodes.length > 0 && newData.link != null) {
                $('svg').trigger('updateData', [newData]);
                console.log('triggered updateData', this, [newData]);
              }
            }
          });
        })
      ;
    });
  }

  accumulateNode(node) {
    return d => {
      // Build linked data node.
      var key = d["?p"], value;
      if (key === rdfType) {
        key   = "@type";
        value = d["?o"];
      } else {
        value = this.parseValue(d["?o"]);
      }
      if (node[key] == null) {
        node[key] = [];
      }
      node[key].push(value);
    };
  }

  parseValue(vString) {
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

    return {'@id': vString};
  }

  buildInspiredByDb() {
    var fragmentsClient = new ldf.FragmentsClient('http://fragments.dbpedia.org/2015/en');

    this.nodes.forEach(n => {
      this.loadInfluencedBy(fragmentsClient, n);
      this.loadInfluences(fragmentsClient, n);
    });
  }

  buildLink(a, propa, propb, clsa, clsb=null) {
    var aid = a["@id"];

    return bnode => {
      var b   = this.getCreator(this.s.get(bnode["@id"])[0]),
          bid = b["@id"];

      if (aid !== bid) {
        this.addLink(a, b, propa, clsa, propb, clsb, aid, bid);
      }
    };
  }

  addLink(a, b, propa, clsa, propb, clsb=null, aid=null, bid=null) {
    var link = null;

    clsb = clsb === null ? clsa : clsb;
    aid = aid === null ? a["@id"] : aid;
    bid = bid === null ? b["@id"] : bid;

    if (!this.linkSeen(aid, bid)) {
      link       = {};
      link[propa]    = this.addNode(a, clsa);
      link[propb]    = this.addNode(b, clsb);
      link['@class'] = clsb;

      this.links.push(link);
      this.seeLink(aid, bid);
    }

    return link;
  }

  addNewNode(node, cls) {
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

    return {index: i, isNew: isNew};
  }

  addNode(node, cls) {
    return this.addNewNode(node, cls).index;
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

    if (isAny(obj, bibframe('Work'), bibframe('BlogPost')) &&
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
    this.svg.append('g').attr('id', 'links');
    this.svg.append('g').attr('id', 'nodes');

    this.force
      .nodes(this.nodes)
      .links(this.links);
    this.linkNodes = this.svg.select('#links').selectAll('line');
    this.nodeNodes = this.svg.select('#nodes').selectAll('circle');

    this.force.on("tick", () => this.tick());
    $("svg").on('updateData', (ev, newData) => {
      console.log('updateData', ev, newData);
      newData.nodes.forEach(n => this.nodes.push(n));
      if (newData.link != null) {
        this.links.push(newData.link);
      }
      this.start();
    });
  }

  start() {
    this.linkNodes = this.linkNodes.data(this.links);
    this.linkNodes.enter()
      .append("line")
      .attr('class', d => `link ${d["@class"]}`)
    ;
    this.nodeNodes = this.nodeNodes.data(this.nodes);
    this.nodeNodes.enter()
      .insert("circle")
      .attr('class', d => `node ${d["@class"]}`)
      .attr("r", radius)
      .append('title').text(d => getLabel(d))
      .call(this.force.drag)
    ;

    this.force.start();
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

