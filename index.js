var debug = require('debug')('oa-graphs')
var inherits = require('inherits');
var Map = require('es6-map');

var Graph = require('oa-graph');

function Graphs (options) {
  options = options || {};
  debug("constructor", options);
  // call new constructor if not already
  if (!(this instanceof Graphs)) {
    return new Graphs(options);
  }

  // call Map constructor on this
  Map.call(this);

  // setup graph db
  var level = options.db;
  delete options.db;

  this.db = require('levelgraph-jsonld')(
    require('levelgraph')(level, options)
  , options);

  // setup type registry
  if (options.types) {
    this.types = options.types;
  } else {
    this.types = require('oa-types')();
  }

  // use any given graphs
  if (options.graphs) {
    for (var id in options.graphs) {
      debug("use-ing", options.graphs[id]);
      this.use(options.graphs[id]);
    }
  }
}
inherits(Graphs, Map);

Graphs.prototype.use = function (graph) {
  debug("use", graph);

  // if not instanceof Graph, assume it is type
  if (!(graph instanceof Graph)) {
    graph = new Graph({
      db: graph.db || this.db,
      types: graph.types || this.types,
      type: graph.type,
      id: graph.id,
      graphs: this,
    });
  }

  debug("set", graph.id, graph);
  this.set(graph.id, graph);

  return graph;
};

module.exports = Graphs;
