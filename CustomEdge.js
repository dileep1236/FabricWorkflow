import React from 'react';
import { getBezierPath } from 'reactflow';

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        style={style}
        className="react-flow__edge-path"
        markerEnd={markerEnd}
      />
      <foreignObject
        width={80}
        height={40}
        x={labelX - 40}
        y={labelY - 20}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '2px 4px',
          }}
        >
          <input
            type="number"
            value={data?.sequence ?? ''}
            onChange={(e) =>
              data?.onSequenceChange?.(id, parseInt(e.target.value, 10))
            }
            style={{
              width: '30px',
              border: 'none',
              outline: 'none',
              fontSize: '12px',
              textAlign: 'center',
            }}
          />
          <button
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              cursor: 'pointer',
            }}
            onClick={() => data?.onDelete?.(id)}
          >
            ❌
          </button>
        </div>
      </foreignObject>
    </>
  );
};

export default CustomEdge;
