import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { tokens } from '../theme/theme';

/**
 * CustomEdge — REDESIGNED.
 * --------------------------------------------------------------------------
 * Same data contract as before (data.sequence, data.onSequenceChange,
 * data.onDelete). Replaces the raw <foreignObject> + bordered div with a
 * themed pill rendered via EdgeLabelRenderer (sharper, no SVG scaling
 * artifacts) and a smooth branded bezier path.
 */
export default function CustomEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, markerEnd, data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
        style={{ stroke: tokens.color.brand[300], strokeWidth: 2 }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#fff',
            border: `1px solid ${tokens.color.slate[200]}`,
            borderRadius: 999,
            padding: '2px 6px',
            boxShadow: tokens.shadow.sm,
            pointerEvents: 'all',
            fontSize: 11,
          }}
          className="nodrag nopan"
        >
          <span style={{ color: tokens.color.slate[500], fontWeight: 700 }}>#</span>
          <input
            type="number"
            value={data?.sequence ?? ''}
            onChange={(e) =>
              data?.onSequenceChange?.(id, parseInt(e.target.value, 10))
            }
            style={{
              width: 28,
              border: 'none',
              outline: 'none',
              fontSize: 11,
              textAlign: 'center',
              color: tokens.color.brand[700],
              fontWeight: 700,
              background: 'transparent',
            }}
          />
          <button
            onClick={() => data?.onDelete?.(id)}
            title="Delete edge"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: tokens.color.slate[300],
              fontSize: 13,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
