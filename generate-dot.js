const totalDur = Math.max(points.length * 0.15, 12).toFixed(1);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}"
     height="${height}"
     viewBox="0 0 ${width} ${height}">

  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="50%" stop-color="#39d353"/>
      <stop offset="100%" stop-color="#7ee787"/>
    </linearGradient>
  </defs>

  <rect width="${width}" height="${height}" fill="transparent"/>

  ${rects}

  <!-- Invisible motion path -->
  <path id="motionPath"
        d="${pathD}"
        fill="none"
        stroke="none"/>

  <!-- Animated glowing trail -->
  <path
      d="${pathD}"
      fill="none"
      stroke="url(#trailGradient)"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="1000"
      stroke-dasharray="100 900">

      <animate
          attributeName="stroke-dashoffset"
          from="1000"
          to="0"
          dur="${totalDur}s"
          repeatCount="indefinite"/>
  </path>

  <!-- Moving Dot -->
  <circle r="5" fill="#39d353" filter="url(#glow)">
      <animateMotion
          dur="${totalDur}s"
          repeatCount="indefinite"
          rotate="auto">
          <mpath href="#motionPath"/>
      </animateMotion>
  </circle>

  <!-- White center -->
  <circle r="2.5" fill="#ffffff">
      <animateMotion
          dur="${totalDur}s"
          repeatCount="indefinite"
          rotate="auto">
          <mpath href="#motionPath"/>
      </animateMotion>
  </circle>

</svg>
`;
