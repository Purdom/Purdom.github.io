---
---

'use strict';

function bibframe(thing) {
    return "http://bibframe.org/vocab/" + thing;
}

function purdom(thing) {
    return "http://purdom.org/reading#" + thing;
}

function rdf(thing) {
  return `http://www.w3.org/1999/02/22-rdf-syntax-ns#${thing}`;
}

function rdfs(thing) {
    return "http://www.w3.org/2000/01/rdf-schema#" + thing;
}

function dbo(thing) {
  return `http://dbpedia.org/ontology/${thing}`;
}

const personType   = bibframe("Person");
const workType     = bibframe("Work");
const creator      = bibframe("creator");
const leadTo       = purdom("lead_to");
const inspiredBy   = purdom("inspired_by");
const label        = rdfs("label");
const rdfType      = rdf("type");

function getTypeOf(obj) {
  var type = obj["@type"];
  return (type === undefined ? null : type[0]);
}

function isA(obj, typeUri) {
  return (obj["@type"].find(t => t === typeUri) != null);
}

function isAny(obj, ...typeUris) {
  var typ = obj["@type"], is = false;

  if (Array.isArray(typ)) {
    var typeSet = new Set();
    typeUris.forEach(t => typeSet.add(t));
    is = (typ.find(t => typeSet.has(t)) != null);
  } else if (typeof typ === 'string') {
    is = (typeUris.find(t => t === typ) != null);
  }

  return is;
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
    l = l.find(n => n["@language"] === "en");
    if (l != null) {
      l = l["@value"];
    }
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

function findInspiredBy(graph) {
  var expanded = [];
  for (var i=0; i<graph.length; i++) {
    var node = graph[i];
    if (node[inspiredBy] !== undefined) {
      var inspirations = node[inspiredBy],
        o            = node["@id"];
      for (var j=0; j<inspirations.length; j++) {
        expanded.push({s: inspirations[j]["@id"], o: o});
      }
    }
  }
  return expanded;
}

function findCreateSubject(graph, sId) {
  var subject = graph.filter(function(n) {
    return (n["@id"] === sId);
  });
  if (subject.length === 0) {
    var n = {
      "@id": sId
    };
    subject.push(n);
    graph.push(n);
  }
  return subject;
}


function addLeadTo(n, o) {
  var purdom_lead_to = n[leadTo];
  if (purdom_lead_to === undefined) {
    n[leadTo] = purdom_lead_to = [];
  }
  purdom_lead_to.push({
    "@id": o
  });
}

function expandImplicits(graph) {
  var expanded = findInspiredBy(graph);

  expanded.forEach(function(expand) {
    var subjects = findCreateSubject(graph, expand.s);
    subjects.forEach(function(n) {
      addLeadTo(n, expand.o);
    });
  });

  return graph;
}

function byType(expanded) {
  var m = new Map();
  expanded.forEach(o => {
    pushIndex(m, o["@type"], t);
  });
  return m;
}

function byS(expanded) {
  var m = new Map();
  expanded.forEach(o => {
    pushIndex(m, o["@id"], o);
  });
  return m;
}

function byP(expanded) {
  var m = new Map();
  expanded.forEach(o => {
    for (var p in o) {
      if (!p.startsWith("@")) {
        pushIndex(m, p, o);
      }
    }
  });
  return m;
}

function byO(expanded) {
  var m = new Map();
  expanded.forEach(o => {
    for (var p in o) {
      if (typeof o[p] === 'string') {
        pushIndex(m, o[p], o);
      } else {
        o[p].forEach(v => {
          var k;
          if (typeof v === 'string') {
            k = v;
          } else if (v["@id"] === undefined) {
            k = v["@value"];
          } else {
            k = v["@id"];
          }
          pushIndex(m, k, o);
        });
      }
    }
  });
  return m;
}

function pushIndex(m, k, v) {
  if (!m.has(k)) {
    m.set(k, []);
  }
  m.get(k).push(v);
}

function withPostLD(f) {
  $.get('/posts.json', data => {
    jsonld.expand(data, (err, expanded) => {
      if (err !== null) {
        console.log('ERROR', err);
      } else {
        f(expanded);
      }
    });
  });
}
