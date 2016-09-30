---
---

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

const personType   = bibframe("Person");
const workType     = bibframe("Work");
const creator      = bibframe("creator");
const leadTo       = purdom("lead_to");
const inspiredBy   = purdom("inspired_by");
const label        = rdfs("label");

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

