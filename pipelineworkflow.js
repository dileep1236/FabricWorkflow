import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, useNodesState,
  applyEdgeChanges, addEdge, Handle, Position, BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Typography, Chip, CircularProgress, Stack, Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';

import CustomEdge from './CustomEdge';
import { api } from '../api/client';
import { useToast } from './ToastProvider';
import { tokens } from '../theme/theme';

/**
 * PipelineWorkflow — REDESIGNED.
 * --------------------------------------------------------------------------
 * The full DAG logic is preserved verbatim:
 *   - drag-from-palette → onDrop creates a 'customNode'
 *   - onConnect adds a 'custom' edge with an incrementing sequence
 *   - onEdgesChange via applyEdgeChanges
 *   - double-click opens the node param editor (label/project/source/runId)
 *   - handleRun fires all nodes in parallel against /run-pipeline and maps
 *     each node's status to loading/success/error
 *
 * Only the look changed: a branded component palette, polished status-aware
 * nodes, a themed run bar, MiniMap/Controls styling, and toast feedback.
 */

const COMPONENTS = [
  { type: 'sourcetobronze', label: 'Source → Bronze' },
  { type: 'bronzetovalidated', label: 'Bronze → Validated' },
  { type: 'validatedtoenriched', label: 'Validated → Enriched' },
  { type: 'enrichedtogold', label: 'Enriched → Gold' },
];

const STATUS_STYLE = {
  idle: { bg: '#fff', border: tokens.color.slate[200], accent: tokens.color.slate[300] },
  loading: { bg: '#fff9ec', border: tokens.color.warning, accent: tokens.color.warning },
  success: { bg: '#eefaf2', border: tokens.color.success, accent: tokens.color.success },
  error: { bg: '#fdf1f1', border: tokens.color.error, accent: tokens.color.error },
};

function CustomNode({ id, data }) {
  const { label, deleteNode, status = 'idle' } = data;
  const s = STATUS_STYLE[status] || STATUS_STYLE.idle;
  return (
    <Box
      sx={{
        minWidth: 168,
        bgcolor: s.bg,
        border: `1.5px solid ${s.border}`,
        borderRadius: 2,
        boxShadow: tokens.shadow.sm,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ height: 4, bgcolor: s.accent }} />
      <Handle type="target" position={Position.Top} style={{ background: tokens.color.brand[500] }} />
      <Box sx={{ px: 1.5, py: 1.25, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: tokens.color.slate[900] }}>
          {label}
        </Typography>
        <Box sx={{ mt: 0.5, height: 18, display: 'grid', placeItems: 'center' }}>
          {status === 'loading' && <CircularProgress size={13} sx={{ color: tokens.color.warning }} />}
          {status === 'success' && <CheckCircleIcon sx={{ fontSize: 15, color: tokens.color.success }} />}
          {status === 'error' && <ErrorIcon sx={{ fontSize: 15, color: tokens.color.error }} />}
        </Box>
      </Box>
      <Handle type="source" position={Position.Bottom} style={{ background: tokens.color.brand[500] }} />
      <button
        onClick={(e) => { e.stopPropagation(); deleteNode(id); }}
        title="Remove node"
        style={{
          position: 'absolute', top: -8, right: -8, width: 18, height: 18,
          borderRadius: '50%', border: '1px solid ' + tokens.color.slate[200],
          background: '#fff', color: tokens.color.slate[500], cursor: 'pointer',
          fontSize: 12, lineHeight: 1, display: 'grid', placeItems: 'center',
          boxShadow: tokens.shadow.sm,
        }}
      >
        ×
      </button>
    </Box>
  );
}

const nodeTypes = { customNode: CustomNode };
const edgeTypes = { custom: CustomEdge };

function Palette({ onDragStart }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: 210, p: 2, borderRadius: 0, borderTop: 0, borderBottom: 0,
        borderLeft: 0, bgcolor: tokens.color.slate[25],
        borderColor: tokens.color.slate[100],
      }}
    >
      <Typography
        sx={{
          fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: tokens.color.slate[500], mb: 1.5,
        }}
      >
        Components
      </Typography>
      <Stack spacing={1}>
        {COMPONENTS.map((c) => (
          <Box
            key={c.type}
            draggable
            onDragStart={(e) => onDragStart(e, c.type)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 1.25, borderRadius: 1.5, cursor: 'grab',
              bgcolor: '#fff', border: `1px solid ${tokens.color.slate[100]}`,
              fontSize: '0.78rem', fontWeight: 600, color: tokens.color.slate[700],
              transition: 'all .15s',
              '&:hover': {
                borderColor: tokens.color.brand[300],
                boxShadow: tokens.shadow.sm,
              },
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: 16, color: tokens.color.slate[300] }} />
            {c.label}
          </Box>
        ))}
      </Stack>
      <Typography sx={{ mt: 2, fontSize: '0.68rem', color: tokens.color.slate[300] }}>
        Drag a component onto the canvas, then connect nodes and set an order.
      </Typography>
    </Paper>
  );
}

export default function PipelineWorkflow() {
  const toast = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useState([]);
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [edgeSequenceCounter, setEdgeSequenceCounter] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeParams, setNodeParams] = useState({
    projectname: '', sourcename: '', pipelinerunid: '',
  });
  const wrapperRef = useRef(null);

  const deleteNode = useCallback((id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes]);

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event) => {
    event.preventDefault();
    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    setNodes((nds) => [
      ...nds,
      {
        id: `${+new Date()}`,
        type: 'customNode',
        position,
        data: {
          label: nodeType,
          deleteNode,
          parameters: { projectname: '', sourcename: '', pipelinerunid: '' },
        },
        status: 'idle',
      },
    ]);
  };

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const handleSequenceChange = (edgeId, newSeq) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, sequence: newSeq } } : e,
      ),
    );
  };

  const onConnect = (params) => {
    const newEdge = {
      ...params,
      id: `${params.source}-${params.target}`,
      type: 'custom',
      data: {
        sequence: edgeSequenceCounter,
        onDelete: (edgeId) =>
          setEdges((eds) => eds.filter((e) => e.id !== edgeId)),
        onSequenceChange: handleSequenceChange,
      },
    };
    setEdges((eds) => addEdge(newEdge, eds));
    setEdgeSequenceCounter((p) => p + 1);
  };

  const onNodeDoubleClick = (_, node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeParams(node.data.parameters || { projectname: '', sourcename: '', pipelinerunid: '' });
  };

  const handleSaveNode = () => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: {
                ...node.data,
                label: nodeLabel,
                deleteNode,
                parameters: nodeParams,
              },
            }
          : node,
      ),
    );
    setSelectedNode(null);
    toast.success('Node updated.');
  };

  const handleRun = async () => {
    if (nodes.length === 0) {
      toast.warning('Add at least one node before running.');
      return;
    }
    setWorkflowStatus('running');

    const promises = nodes.map(async (node) => {
      const { parameters = {}, label } = node.data;
      const nodeId = node.id;
      const payload = {
        projectname: parameters.projectname || 'defaultProject',
        sourcename: parameters.sourcename || 'defaultSource',
        pipelinename: label,
        pipelinerunid: parameters.pipelinerunid || `run_${Date.now()}`,
      };

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, status: 'loading' } } : n,
        ),
      );

      try {
        const result = await api.post('/run-pipeline', payload);
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status: result.status === 'Completed' ? 'success' : 'error',
                  },
                }
              : n,
          ),
        );
      } catch (err) {
        setNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, status: 'error' } } : n,
          ),
        );
      }
    });

    await Promise.allSettled(promises);
    setWorkflowStatus('done');
    toast.success('Workflow run complete.');
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 124px)',
        border: `1px solid ${tokens.color.slate[100]}`,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
      <Palette onDragStart={onDragStart} />

      <Box
        ref={wrapperRef}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{ flex: 1, position: 'relative' }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            position: 'absolute', top: 16, right: 16, zIndex: 10,
            alignItems: 'center',
          }}
        >
          <Chip
            size="small"
            label={`${nodes.length} nodes · ${edges.length} edges`}
            sx={{
              bgcolor: '#fff', border: `1px solid ${tokens.color.slate[100]}`,
              color: tokens.color.slate[500], fontWeight: 600,
            }}
          />
          <Button
            variant="contained"
            startIcon={
              workflowStatus === 'running'
                ? <CircularProgress size={16} color="inherit" />
                : <PlayArrowIcon />
            }
            disabled={workflowStatus === 'running'}
            onClick={handleRun}
          >
            {workflowStatus === 'running' ? 'Running…' : 'Run Workflow'}
          </Button>
        </Stack>

        <ReactFlow
          nodes={nodes.map((n) => ({ ...n, data: { ...n.data, deleteNode } }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={tokens.color.slate[200]}
          />
          <Controls
            style={{
              borderRadius: 8,
              border: `1px solid ${tokens.color.slate[100]}`,
              boxShadow: tokens.shadow.sm,
            }}
          />
          <MiniMap
            pannable
            zoomable
            nodeColor={() => tokens.color.brand[300]}
            maskColor="rgba(244,246,248,0.7)"
            style={{
              borderRadius: 8,
              border: `1px solid ${tokens.color.slate[100]}`,
            }}
          />
        </ReactFlow>
      </Box>

      <Dialog
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Node
          <Button
            onClick={() => setSelectedNode(null)}
            sx={{ position: 'absolute', top: 12, right: 12, minWidth: 0, p: 0.5 }}
          >
            <CloseIcon fontSize="small" />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField
              label="Label"
              fullWidth
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
            />
            <TextField
              label="Project Name"
              fullWidth
              value={nodeParams.projectname}
              onChange={(e) =>
                setNodeParams((p) => ({ ...p, projectname: e.target.value }))
              }
            />
            <TextField
              label="Source Name"
              fullWidth
              value={nodeParams.sourcename}
              onChange={(e) =>
                setNodeParams((p) => ({ ...p, sourcename: e.target.value }))
              }
            />
            <TextField
              label="Pipeline Run ID"
              fullWidth
              value={nodeParams.pipelinerunid}
              onChange={(e) =>
                setNodeParams((p) => ({ ...p, pipelinerunid: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSelectedNode(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNode}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
