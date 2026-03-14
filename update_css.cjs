const fs = require('fs');

let css = fs.readFileSync('src/styles/index.css', 'utf8');
const separator = '/* --- Liquid Glass Button Styles --- */';
const parts = css.split(separator);

if (parts.length > 1) {
    const newStyles = `
/* --- Liquid Glass Button Styles --- */
.liquid-btn {
  position: relative;
  overflow: hidden;
  border-radius: 9999px; /* Force pill shape for that reference look */
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 
    inset 0 4px 6px rgba(255, 255, 255, 0.6), /* Strong Top inner shine */
    inset 0 -4px 6px rgba(0, 0, 0, 0.15), /* Bottom inner shadow */
    0 8px 16px rgba(0, 0, 0, 0.15), /* Drop shadow */
    0 2px 4px rgba(0, 0, 0, 0.1); /* Tight shadow */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateZ(0); /* Hardware accel */
  color: white; /* Default text color */
  text-shadow: 0 1px 2px rgba(0,0,0,0.2); /* Enhance text readability */
}

/* The Gloss Overlay (Upper Half Reflection) */
.liquid-btn::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 45%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 9999px 9999px 0 0;
  pointer-events: none;
}

/* The Animated Shine Effect on Hover */
.liquid-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -150%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  transform: skewX(-20deg);
  transition: all 0.6s ease;
  pointer-events: none;
}

.liquid-btn:hover {
  transform: translateY(-2px);
  box-shadow: 
    inset 0 4px 8px rgba(255, 255, 255, 0.8),
    inset 0 -4px 6px rgba(0, 0, 0, 0.15),
    0 12px 20px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
  border-top-color: rgba(255, 255, 255, 1);
}

.liquid-btn:hover::before {
  left: 150%;
}

.liquid-btn:active {
  transform: translateY(1px);
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    inset 0 -2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Color Variants */
.liquid-btn-blue {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(29, 78, 216, 0.9));
}

.liquid-btn-emerald {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.7), rgba(4, 120, 87, 0.9));
}

.liquid-btn-red {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.7), rgba(185, 28, 28, 0.9));
}

.liquid-btn-white {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  color: var(--text-main);
  text-shadow: none;
}
`;
    fs.writeFileSync('src/styles/index.css', parts[0] + newStyles, 'utf8');
    console.log('Successfully updated index.css');
}
