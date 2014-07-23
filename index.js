var debug = require('debug')('oa-graphs')
var inherits = require('inherits');
var Map = require('es6-map');

var Graph = require('oa-graph');

function Graphs (options) {
  debug("constructor", options);
  // call new constructor if not already
  if (!(this instanceof Graphs)) {
    return new Graphs(options);
  }

  // setup graph db
  var level = options.db;
  delete options.db;

  this.db = require('levelgraph-jsonld')(
    require('levelgraph')(level, options)
  , options);
  
  // call Map constructor on this
  Map.call(this);
}
inherits(Graphs, Map);

Graphs.prototype.use = function (graph) {
  debug("set", graph);

  // if not instanceof Graph, assume it is type
  if (!(graph instanceof Graph)) {
    graph = new Graph({
      db: graph.db || this.db,
      types: graph.types || this.types,
      type: graph.type,
      name: graph.name,
    });
  }

  this.set(graph.name, graph);

  return graph;
};

module.exports = Graphs;
