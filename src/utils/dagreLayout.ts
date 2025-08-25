// ./utils/dagreLayout.ts
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';
import { BasePayload } from '../types/nodes';
import { nodeGroupDimensions } from './nodeStyles';

const nodeDimensions = {
    'QuestionNode': { width: nodeGroupDimensions['QuestionNode'].width, height: nodeGroupDimensions['QuestionNode'].height },
    'NotesNode': { width: nodeGroupDimensions['NotesNode'].width, height: nodeGroupDimensions['NotesNode'].height },
    'NonResizableNode': { width: nodeGroupDimensions['NonResizableNode'].width, height: nodeGroupDimensions['NonResizableNode'].height },
    'Slide': { width: nodeGroupDimensions['Slide'].width, height: nodeGroupDimensions['Slide'].height },
    'TooltipNode': { width: nodeGroupDimensions['TooltipNode'].width, height: nodeGroupDimensions['TooltipNode'].height },
    'TemplateNode': { width: nodeGroupDimensions['TemplateNode'].width, height: nodeGroupDimensions['TemplateNode'].height },
    'CustomResizableNode': { width: nodeGroupDimensions['CustomResizableNode'].width, height: nodeGroupDimensions['CustomResizableNode'].height },
    // Si tienes otros nodos, agrégalos aquí
};
/**
 * Esta función ahora hace el layout para un único subgrafo (un grupo de pregunta-respuesta).
 * @param nodes - Nodos de un solo grupo
 * @param edges - Aristas de un solo grupo
 * @returns - Nodos con posiciones calculadas para ese grupo
 */

export const getLayoutedElements = (nodes: Node<BasePayload>[], edges: Edge[]) => {
    const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 50 });

nodes.forEach((node) => {
    // Asigna dimensiones a cada tipo de nodo
    const dimensions = nodeDimensions[node.type as keyof typeof nodeDimensions] || nodeGroupDimensions['default'];
        g.setNode(node.id, { ...node, width: dimensions.width, height: dimensions.height });
    });

  // 3. Añade los bordes
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // 4. Ejecuta el layout
  dagre.layout(g);
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = g.node(node.id);
        if (!nodeWithPosition) {
            console.error(`Node with id ${node.id} not found in Dagre graph.`);
            return node; // Devuelve el nodo original si no se encuentra
        }
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWithPosition.width / 2,
                y: nodeWithPosition.y - nodeWithPosition.height / 2,
            },
        };
    });
  // 5. Mapea las posiciones de vuelta a los nodos
    return {
        nodes: layoutedNodes,
        edges: edges, // Las aristas no cambian, solo se retornan
    };
};