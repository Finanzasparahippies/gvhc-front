import { useMemo } from 'react';

type Node = {
    id: string;
    label?: string;
    [key: string]: any;
}

type PositionedNode = Node & {
    position: {
        x: number;
        y: number;
    };
    draggable: boolean;
};

/**
 * Hook para distribuir nodos en una cuadrícula.
 * @param {Array} nodes - Lista de nodos a distribuir.
 * @param {number} nodesPerRow - Cantidad de nodos por fila.
 * @param {number} xGap - Espaciado horizontal entre nodos.
 * @param {number} yGap - Espaciado vertical entre nodos.
 * @returns {Array} Nodos con posiciones ajustadas.
 */


const useGridDistribution = (nodes: Node[], nodesPerRow: number = 5, xGap: number = 200, yGap: number = 150 ): PositionedNode[] => {
    const distributedNodes = useMemo(() => {
        return nodes.map((node, index) => {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;

        return {
            ...node,
            position: {
            x: col * xGap,
            y: row * yGap,
            },
            draggable: true, // Habilita la opción de arrastrar los nodos
        };
        });
    }, [nodes, nodesPerRow, xGap, yGap]);

    return distributedNodes;
};

export default useGridDistribution;
