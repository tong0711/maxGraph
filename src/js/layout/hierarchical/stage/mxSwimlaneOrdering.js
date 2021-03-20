/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 */
import mxHierarchicalLayoutStage from "./mxHierarchicalLayoutStage";

class mxSwimlaneOrdering extends mxHierarchicalLayoutStage {
  /**
   * Variable: layout
   *
   * Reference to the enclosing <mxHierarchicalLayout>.
   */
  layout = null;

  /**
   * Class: mxSwimlaneOrdering
   *
   * An implementation of the first stage of the Sugiyama layout. Straightforward
   * longest path calculation of layer assignment
   *
   * Constructor: mxSwimlaneOrdering
   *
   * Creates a cycle remover for the given internal model.
   */
  constructor(layout) {
    super();

    this.layout = layout;
  };

  /**
   * Function: execute
   *
   * Takes the graph detail and configuration information within the facade
   * and creates the resulting laid out graph within that facade for further
   * use.
   */
  execute = (parent) => {
    var model = this.layout.getModel();
    var seenNodes = {};
    var unseenNodes = mxUtils.clone(model.vertexMapper, null, true);

    // Perform a dfs through the internal model. If a cycle is found,
    // reverse it.
    var rootsArray = null;

    if (model.roots != null) {
      var modelRoots = model.roots;
      rootsArray = [];

      for (var i = 0; i < modelRoots.length; i++) {
        rootsArray[i] = model.vertexMapper.get(modelRoots[i]);
      }
    }

    model.visit((parent, node, connectingEdge, layer, seen) => {
      // Check if the cell is in it's own ancestor list, if so
      // invert the connecting edge and reverse the target/source
      // relationship to that edge in the parent and the cell
      // Ancestor hashes only line up within a swimlane
      var isAncestor = parent != null && parent.swimlaneIndex == node.swimlaneIndex && node.isAncestor(parent);

      // If the source->target swimlane indices go from higher to
      // lower, the edge is reverse
      var reversedOverSwimlane = parent != null && connectingEdge != null &&
          parent.swimlaneIndex < node.swimlaneIndex && connectingEdge.source == node;

      if (isAncestor) {
        connectingEdge.invert();
        mxUtils.remove(connectingEdge, parent.connectsAsSource);
        node.connectsAsSource.push(connectingEdge);
        parent.connectsAsTarget.push(connectingEdge);
        mxUtils.remove(connectingEdge, node.connectsAsTarget);
      } else if (reversedOverSwimlane) {
        connectingEdge.invert();
        mxUtils.remove(connectingEdge, parent.connectsAsTarget);
        node.connectsAsTarget.push(connectingEdge);
        parent.connectsAsSource.push(connectingEdge);
        mxUtils.remove(connectingEdge, node.connectsAsSource);
      }

      var cellId = mxCellPath.create(node.cell);
      seenNodes[cellId] = node;
      delete unseenNodes[cellId];
    }, rootsArray, true, null);
  };
}

export default mxSwimlaneOrdering;
