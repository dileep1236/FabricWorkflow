import React, { useEffect, useRef } from 'react';
import { dia, shapes, connectionStrategies } from 'jointjs';

const Designer = () => {
    const paperRef = useRef(null);
    const graphRef = useRef(new dia.Graph());

    useEffect(() => {
        initializeDesigner();
    }, []);

    const initializeDesigner = () => {
        if (!paperRef.current) return;

        const paperInstance = new dia.Paper({
            el: paperRef.current,
            model: graphRef.current,
            width: 800,
            height: 600,
            gridSize: 10,
            background: { color: '#f8f9fa' },
            interactive: { linkMove: true }, // Enable link dragging
            connectionStrategy: connectionStrategies.pinAbsolute, // Allow pointer-based linking
        });

        // Create two nodes
        const rect1 = new shapes.standard.Rectangle();
        rect1.position(100, 50).resize(100, 40).attr({
            body: { fill: 'blue' },
            label: { text: 'Node 1', fill: 'white' },
        });

        const rect2 = new shapes.standard.Rectangle();
        rect2.position(300, 150).resize(100, 40).attr({
            body: { fill: 'green' },
            label: { text: 'Node 2', fill: 'white' },
        });

        graphRef.current.addCells([rect1, rect2]);

        // Enable pointer-based linking
        paperInstance.on('element:pointerdown', (elementView, evt) => {
            const link = new dia.Link({
                source: { id: elementView.model.id },
                target: { x: evt.clientX, y: evt.clientY }, // Temporary target
                attrs: { line: { stroke: 'black', strokeWidth: 2 } },
            });

            graphRef.current.addCell(link);

            paperInstance.on('element:pointerup', (targetView) => {
                link.set('target', { id: targetView.model.id }); // Finalize connection
            });
        });
    };

    return (
        <div>
            <h2>Diagram Designer</h2>
            <div ref={paperRef} className="paper-container" style={{ border: '1px solid #ccc', boxShadow: '0px 5px 2.5px silver' }}></div>
        </div>
    );
};

export default Designer;
