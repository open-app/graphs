var debug = require('debug')('oa-graphs')
var inherits = require('inherits');
var Map = require('es6-map');

var Graph = require('oa-graph');

function Graphs (db, options) {
  debug("constructor", db, options);
  // call new constructor if not already
  if (!(this instanceof Graphs)) {
    return new Graphs(db, options);
  }

  // save graph db
  this.db = require('levelgraph-jsonld')(
    require('levelgraph')(db, options)
  , options);
  
  // call Map constructor on this
  Map.call(this);

  // save Map.set
  this.__set = this.set;
  // and use our set function
  this.set = this._set;
  delete this._set;
}
inherits(Graphs, Map);

Graphs.prototype._set = function (graph) {
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

  return this.__set(graph.name, graph);
};

module.exports = Graphs;
