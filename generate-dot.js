// generate-dot.js
// Generates a glowing dot animation that follows your GitHub contributions.

const username = process.env.GH_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
  console.error("Missing GH_USERNAME or GITHUB_TOKEN");
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

async function main() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        login: username,
      },
    }),
  });

  const json = await response.json();

  if (json.errors) {
    console.error(json.errors);
    process.exit(1);
  }

  const weeks =
    json.data.user.contributionsCollection.contributionCalendar.weeks;

  const CELL = 12;
  const GAP = 4;
  const OFFSET = 20;

  const WIDTH = weeks.length * (CELL + GAP) + OFFSET * 2;
  const HEIGHT = 7 * (CELL + GAP) + OFFSET * 2;

  let rects = "";
  let points = [];

  weeks.forEach((week, weekIndex) => {
    week.contributionDays.forEach((day, dayIndex) => {
      const x = OFFSET + weekIndex * (CELL + GAP);
      const y = OFFSET + dayIndex * (CELL + GAP);

      rects += `
<rect
x="${x}"
y="${y}"
width="${CELL}"
height="${CELL}"
rx="2"
fill="${day.color}"
/>`;

      if (day.contributionCount > 0) {
        points.push({
          x: x + CELL / 2,
          y: y + CELL / 2,
        });
      }
    });
  });

  if (points.length === 0) {
    console.log("No contributions found.");
    return;
  }

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const duration = Math.max(points.length * 0.12, 10).toFixed(1);

  const svg = `

<svg
xmlns="http://www.w3.org/2000/svg"
width="${WIDTH}"
height="${HEIGHT}"
viewBox="0 0 ${WIDTH} ${HEIGHT}"
>

<defs>

<filter id="glow">

<feGaussianBlur stdDeviation="3" result="blur"/>

<feMerge>

<feMergeNode in="blur"/>

<feMergeNode in="SourceGraphic"/>

</feMerge>

</filter>

<linearGradient id="trail" x1="0%" y1="0%" x2="100%" y2="0%">

<stop offset="0%" stop-color="#22c55e"/>

<stop offset="100%" stop-color="#39d353"/>

</linearGradient>

</defs>

${rects}

<path
id="motionPath"
d="${path}"
fill="none"
stroke="none"
/>

<path
d="${path}"
fill="none"
stroke="url(#trail)"
stroke-width="3"
stroke-linecap="round"
stroke-linejoin="round"
pathLength="1000"
stroke-dasharray="80 920"
>

<animate
attributeName="stroke-dashoffset"
from="1000"
to="0"
dur="${duration}s"
repeatCount="indefinite"
/>

</path>

<circle
r="5"
fill="#39d353"
filter="url(#glow)"
>

<animateMotion
dur="${duration}s"
repeatCount="indefinite"
rotate="auto"
>

<mpath href="#motionPath"/>

</animateMotion>

</circle>

<circle
r="2.3"
fill="white"
>

<animateMotion
dur="${duration}s"
repeatCount="indefinite"
rotate="auto"
>

<mpath href="#motionPath"/>

</animateMotion>

</circle>

</svg>
`;

  const fs = await import("node:fs");

  fs.mkdirSync("dist", {
    recursive: true,
  });

  fs.writeFileSync("dist/contribution-dot.svg", svg);

  console.log("Contribution dot generated successfully.");
}

main().catch(console.error);
