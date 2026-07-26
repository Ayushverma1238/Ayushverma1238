// generate-dot.js
// Fetches the real GitHub contribution calendar and renders an SVG
// where a single dot travels cell-to-cell through days you actually
// committed on (contributionCount > 0), looping forever.

const username = process.env.GH_USERNAME;
const token = process.env.GITHUB_TOKEN;

if (!username || !token) {
  console.error("Missing GH_USERNAME or GITHUB_TOKEN env vars");
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
            color
          }
        }
      }
    }
  }
}`;

async function main() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });

  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    process.exit(1);
  }

  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;

  const cell = 12;
  const gap = 3;
  const margin = 20;
  const step = cell + gap;

  const width = margin * 2 + weeks.length * step;
  const height = margin * 2 + 7 * step;

  // Build background grid + collect centers of days that actually have commits
  let rects = "";
  const points = [];

  weeks.forEach((week, wi) => {
    week.contributionDays.forEach((day, di) => {
      const x = margin + wi * step;
      const y = margin + di * step;
      rects += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${day.color}" />\n`;

      if (day.contributionCount > 0) {
        points.push({ x: x + cell / 2, y: y + cell / 2 });
      }
    });
  });

  // Chronological path through committed days only
  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  const totalDur = Math.max(points.length * 0.15, 10).toFixed(1);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .bg { fill: transparent; }
  </style>
  <rect class="bg" width="${width}" height="${height}" />
  ${rects}
  <circle r="5" fill="#39d353" stroke="#0d1117" stroke-width="1.5">
    <animateMotion dur="${totalDur}s" repeatCount="indefinite" path="${pathD}" rotate="auto" />
  </circle>
  <circle r="9" fill="#39d353" opacity="0.35">
    <animateMotion dur="${totalDur}s" repeatCount="indefinite" path="${pathD}" rotate="auto" />
    <animate attributeName="r" values="6;11;6" dur="1.1s" repeatCount="indefinite" />
  </circle>
</svg>`;

  const fs = await import("node:fs");
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/contribution-dot.svg", svg);
  console.log(`Wrote dist/contribution-dot.svg (${points.length} committed days, ${weeks.length} weeks)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
