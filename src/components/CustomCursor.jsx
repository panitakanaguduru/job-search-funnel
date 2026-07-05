import React, { useState, useEffect } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    const checkHover = (e) => {
      const target = e.target;
      if (target.closest('.magnetic') || target.closest('.view-case-btn') || target.closest('.hex-cell')) {
        setHover(true);
      } else {
        setHover(false);
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', checkHover);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', checkHover);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" style={{ left: `${position.x}px`, top: `${position.y}px` }} />
      <div className={`cursor-outline ${hover ? 'hovering' : ''}`} style={{ left: `${position.x}px`, top: `${position.y}px` }} />
    </>
  );
};

export default CustomCursor;
