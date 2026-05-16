import React, { useEffect, useState } from 'react';
import * as joint from 'jointjs';

const EimComponent = ({ project }) => {
    const [graph, setGraph] = useState(null);
    const [paper, setPaper] = useState(null);
    const [sources, setSources] = useState([]);

    useEffect(() => {
        initializeDesigner();
        getProjectSources();
    }, []);

    const initializeDesigner = () => {
        const newGraph = new joint.dia.Graph();
        setGraph(newGraph);

        const newPaper = new joint.dia.Paper({
            el: document.getElementById('paper-container'),
            model: newGraph,
            width: 800,
            height: 600,
            gridSize: 10
        });
        setPaper(newPaper);
    };

    const getProjectSources = async () => {
        try {
            const response = await fetch(`/api/getProjectSources/${project.projectId}`);
            const data = await response.json();
            setSources(data);
        } catch (error) {
            console.error("Error fetching sources:", error);
        }
    };

    const saveGraph = async () => {
        if (!graph) return;
        const graphData = JSON.stringify(graph);
        try {
            await fetch(`/api/saveGraph`, {
                method: "POST",
                body: JSON.stringify({ projectId: project.projectId, graphData }),
                headers: {
                    "Content-Type": "application/json"
                }
            });
            alert("Project saved successfully!");
        } catch (error) {
            console.error("Error saving graph:", error);
        }
    };

    return (
        <div>
            <h2>Project: </h2>
            <button onClick={saveGraph}>Save Graph</button>
            <div id="paper-container" style={{ border: '1px solid black' }}></div>
        </div>
    );
};

export default EimComponent;