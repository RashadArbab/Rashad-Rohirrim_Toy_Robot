import React, { useCallback, useState, FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../app/store';
import { placeRobot, selectCurrentRobot, rotateRobot, moveRobot, fetchReport } from '../features/robot/robotSlice';
import { fetchHistory } from '../features/robot/historySlice';
import SmartToyTwoToneIcon from '@mui/icons-material/SmartToyTwoTone';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../App.css';
import type { ReactNode } from 'react';

// Map facing directions to MUI arrow icons
const arrowIconMap: Record<string, ReactNode> = {
  NORTH: <ArrowUpwardIcon fontSize="small" />, 
  EAST: <ArrowForwardIcon fontSize="small" />, 
  SOUTH: <ArrowDownwardIcon fontSize="small" />, 
  WEST: <ArrowBackIcon fontSize="small" />, 
};

const BoardPage: FC = () => {
  // controls whether the robot is displayed in the grid
  const [showReport, setShowReport] = useState(false);
  // error message when operations fail
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const robot = useSelector(selectCurrentRobot);

  const handleCellClick = (x: number, y: number) => {
    setShowReport(false);
    // place new robot and clear old state, then fetch its history
    dispatch(placeRobot({ x, y }))
      .unwrap()
      .then((placed) => {
        setError(null);
        dispatch(fetchHistory(placed.id));
      })
      .catch((err) => setError(typeof err === 'string' ? err : err.message));
  };

  const handleRotate = useCallback((direction: 'LEFT' | 'RIGHT') => {
    if (!robot) return;
    setShowReport(false);
    dispatch(rotateRobot({ robot_id: robot.id, direction }))
      .unwrap()
      .then((updated) => {
        setError(null);
        dispatch(fetchHistory(updated.id));
      })
      .catch((err) => setError(typeof err === 'string' ? err : err.message));
  }, [dispatch, robot]);

  const handleMove = () => {
    if (!robot) return;
    setShowReport(false);
    dispatch(moveRobot(robot.id))
      .unwrap()
      .then((updated) => {
        setError(null);
        dispatch(fetchHistory(updated.id));
      })
      .catch((err) => setError(typeof err === 'string' ? err : err.message));
  };

  // Fetch current robot state before reporting
  const handleReport = () => {
    if (!robot) return;
    setError(null);
    dispatch(fetchReport(robot.id))
      .unwrap()
      .then(() => {
        setShowReport(true);
      })
      .catch((err) => setError(typeof err === 'string' ? err : err.message));
  };

  // Bind arrow keys for rotation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleRotate('LEFT');
      if (e.key === 'ArrowRight') handleRotate('RIGHT');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [robot, handleRotate]);

  return (
    <div className="home-container">
      <h1 className="page-title">Rohirrim Demo</h1>
      {/* Instruction bar: shows errors, report or instructions */}
      <div className="instruction-bar">
        {error
          ? error
          : showReport && robot
          ? `Robot at (${robot.x}, ${robot.y}), facing ${robot.facing}`
          : 'Click to place the robot, use the buttons or arrows to move'}
      </div>
      <div className="grid">
        {Array.from({ length: 5 }).map((_, row) => {
          const y = 4 - row;
          return (
            <React.Fragment key={row}>
              {Array.from({ length: 5 }).map((_, col) => {
                const x = col;
                const isRobot = robot && robot.x === x && robot.y === y;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`cell ${isRobot ? 'robot' : ''}`}
                    onClick={() => handleCellClick(x, y)}
                  >
                    {isRobot && (
                      <div className="robot-cell-content">
                        <SmartToyTwoToneIcon style={{ fontSize: '2rem' }} />
                        <div className="robot-arrow">
                          {arrowIconMap[robot!.facing]}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      <div className="controls">
        <button onClick={() => handleRotate('LEFT')} disabled={!robot}>
          Rotate Left
        </button>
        <button onClick={() => handleRotate('RIGHT')} disabled={!robot}>
          Rotate Right
        </button>
        <button onClick={handleMove} disabled={!robot}>
          Move
        </button>
      </div>
      <div className="report-button">
        <button onClick={handleReport} disabled={!robot}>
          Report
        </button>
      </div>
    </div>
  );
};

export default BoardPage; 