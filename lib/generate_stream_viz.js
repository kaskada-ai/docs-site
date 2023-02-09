'use strict'

module.exports.register = function (registry, context) {
    registry.block(function () {
        var self = this
        self.named('stream_viz')
        self.onContext('literal')
        self.process(function (parent, reader, attributes) {
            const name = attributes['name'];
            const alt = attributes['alt'];
            const title = attributes['title'];
            if (!name) {
                throw new Error('Missing attribute "name"')
            }

            if (!('file' in context)) {
                throw new Error('Context must be in Antora')
            }
            const { component, version, module, relative } = context.file.src

            let generatedImageContents;
            try {
                var json = JSON.parse(reader.read())
                generatedImageContents = generateSvgString(json)
            } catch (error) {
                throw new Error(`Generating context for ${name} in ${relative}: ${error}`)
            };
            const generatedImagePath = `${name}.svg`

            const file = context.contentCatalog.addFile({
                contents: Buffer.from(generatedImageContents),
                src: {
                    component,
                    version,
                    module,
                    family: 'image',
                    basename: generatedImagePath,
                    relative: generatedImagePath,
                }
            })

            return this.createImageBlock(parent, { target: generatedImagePath, alt, title })
            // return this.createImageBlock(parent, { target: file.pub.url, alt, title } )
        })
    })
};

// Data Color Picker (https://learnui.design/tools/data-color-picker.html)
// Used `#ff323c` as the base color, and generated 4 colors.
const PALETTE = [
    "#ff323c",
    "#ff6029",
    "#ff8514",
    "#ffa600"
];

// Generate the SVG string visualizing one or more expressions.
//
// Each expressions may contain a single stream or multiple (per-entity) streams.
//
// Improvements to make:
// 1. Show the axis.
// 2. Allow specifying times and/or dates.
// 3. Allow drawing windows
function generateSvgString(expressions) {
    // The width of the SVG element
    const width = 800
    // The margin around the SVG element
    const margin = 50
    // The lead-in and -out width for each row
    const lead = 30

    // Determine the time range (used to determine xUnit) and the height.
    // Updates each expression to contain the height of that group of rows.
    var minTime = Infinity
    var maxTime = -Infinity
    var yTranslation = margin
    const heightPerLine = 14;
    const labelHeight = 20;
    const expressionPadding = 10;
    const expressionLabelOffset = 12;
    expressions.forEach(expression => {
        expression.data.forEach(row => {
            if (expression['kind'] == 'windows') {
                minTime = Math.min(minTime, ...row)
                maxTime = Math.max(maxTime, ...row)
            } else {
                row.forEach(d => {
                    minTime = Math.min(minTime, d.t)
                    maxTime = Math.max(maxTime, d.t)
                })
            }
        })

        if (expression['kind'] == 'windows') {
            expression.height = labelHeight + expression.data.length * heightPerLine;
            expression.labelOffset = expression.data.length * heightPerLine - expressionLabelOffset;
        } else {
            expression.height = labelHeight + expression.data.length * (heightPerLine + labelHeight);
            expression.labelOffset = expression.data.length * (heightPerLine + labelHeight) - expressionLabelOffset;
        }
        expression.yTranslation = yTranslation
        yTranslation += expression.height + expressionPadding
    })
    const height = yTranslation + margin

    const lineWidth = width - 2 * (margin + lead);
    const xUnit = lineWidth / (maxTime - minTime);
    const pointLabelOffset = -8;

    function xPos(t) {
        return margin + lead + (t - minTime) * xUnit
    }

    var svgContent = `<svg xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" height="${height}" width="${width}">\n`;
    svgContent += STYLE;
    svgContent += DEFS;

    // 1. Append the label at the bottom indicating the direction of time.
    svgContent += `  <text class="axis" x="${width / 2}" y="${height - margin}">time →</text>\n`

    // 2. Render each row group. We do this in a single "translate" block so that
    // elements within a row group can be positioned relatively.
    expressions.forEach(expression => {
        svgContent += `  <g transform="translate(0, ${expression.yTranslation})">\n`;

        var y = 0;
        expression.data.forEach((row, index) => {
            // 3. Draw the baseline.
            if (expression['kind'] != 'windows') {
                svgContent += `    <line class="baseline lead" x1="${margin}" x2="${margin + lead}" y1="${y}" y2="${y}"/>\n`;
                svgContent += `    <line class="baseline" x1="${margin + lead}" x2="${width - margin - lead}" y1="${y}" y2="${y}"/>\n`;
            }

            // 4. Draw the points (discrete) or segments (continuous)
            if (expression['kind'] == 'windows') {
                var points = []
                row.forEach(point => {
                    points.push(`${xPos(point)},${y}`)
                })
                svgContent += `    <polyline class="window" points="${points.join(' ')}" marker-start="url(#closed)" marker-mid="url(#closed)" marker-end="url(#open)"/>\n`;
                y += heightPerLine;
            } else if (expression['kind'] == 'discrete') {
                // Draw the discrete lead out (just the gray line)
                svgContent += `    <line class="baseline lead" x1="${width - margin - lead}" x2="${width - margin}" y1="${y}" y2="${y}"/>\n`;

                row.forEach(point => {
                    const color = PALETTE[point.color || index];
                    svgContent +=
                        `    <g transform="translate(${xPos(point.t)}, ${y})">
                <circle class="background" r="10"/>
                <circle stroke="${color}" class="discrete" r="4"/>
                <text class="data" y="${pointLabelOffset}">${point.v}</text>
              </g>
          `;
                });
                y += heightPerLine + labelHeight;
            } else if (expression['kind'] == 'continuous') {
                const color = PALETTE[index];

                // Draw the continuous segments, and lead out if needed.
                var start = null;
                row.forEach(curr => {
                    if (curr.v && !start) {
                        // We've reached the start of a segment.
                        start = curr.t
                    } else if (!curr.v && start) {
                        // We've reached a discontinuity.
                        // Draw a segment from the start to this point.
                        svgContent +=
                            `    <line class="continuous" stroke="${color}" x1="${xPos(start)}" x2="${xPos(curr.t)}" y1="${y}" y2="${y}"/>
            `;
                        start = null;
                    }
                })
                if (start) {
                    // The final segment is non-null.
                    // Draw the line from the start and the lead out.
                    if (start != maxTime) {
                        svgContent +=
                            `    <line class="continuous" stroke="${color}" x1="${xPos(start)}" x2="${width - margin - lead}" y1="${y}" y2="${y}"/>
            `;
                    }

                    svgContent +=
                        `    <line class="continuous lead" stroke="${color}" x1="${width - margin - lead}" x2="${width - margin}" y1="${y}" y2="${y}"/>
          `;
                }

                // Draw the continuous labels
                var prev = null;
                row.forEach(curr => {
                    // The current point.
                    svgContent += `    <circle cx="${xPos(curr.t)}" cy="${y}" fill="${color}" class="continuous" r="6"/>\n`

                    // The previous label
                    if (prev && prev.v) {
                        const middle = prev.t + (curr.t - prev.t) / 2;
                        svgContent += `    <text class="data" x="${xPos(middle)}" y="${pointLabelOffset + y}">${prev.v}</text>\n`
                    }
                    prev = curr;
                })

                if (prev && prev.v) {
                    // Draw the final label. We put it half way to the margin (over the lead).
                    // This takes the midpoint of the x position so it can be extend past the
                    // maximum time.
                    const prevX = xPos(prev.t);
                    const x = prevX + (width - margin - prevX) / 2;
                    svgContent += `    <text class="data" x="${x}" y="${pointLabelOffset + y}">${prev.v}</text>\n`
                }
                y += heightPerLine + labelHeight;
            } else {
                throw new Error(`Unrecognized kind '${expression['kind']}'`)
            }
        })

        svgContent += `    <text class="label" x="50" y="${expression.labelOffset}">${expression.label}</text>\n`

        svgContent += '  </g>\n';
    });

    svgContent += '</svg>\n';
    return svgContent
}

const DEFS = `
  <defs>
    <marker id="closed" markerWidth="6" markerHeight="6" refX="3" refY="3">
      <circle cx="3" cy="3" r="2" fill="#FF323C" stroke="none"/>
    </marker>
    <marker id="open" markerWidth="6" markerHeight="6" refX="3" refY="3">
      <circle cx="3" cy="3" r="2" stroke="#FF323C" stroke-width="1" fill="white" />
    </marker>
  </defs>
`

const STYLE = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inconsolata&amp;display=swap');

    circle.continuous {
      stroke: white;
      stroke-width: 4;
    }

    circle.discrete {
      fill: white;
      stroke-width: 4;
    }

    circle.background {
      fill: white;
    }

    line.baseline {
      stroke: #b6b9be;
      stroke-width: 1;
    }

    line.lead {
      stroke-width: 1;
      stroke-dasharray: 3,3;
    }
    line.continuous.lead {
      stroke-dasharray: 6,3;
    }

    line.continuous {
      stroke-width: 4;
    }

    polyline.window {
      stroke: #FF323C;
      stroke-width: 2;
    }

    text.label {
      font: 1em Inconsolata;
      text-anchor: start;
      dominant-baseline: hanging;
    }

    text.data {
      fill: black;
      font: 1em Inconsolata;
      text-anchor: middle;
    }
  </style>
`;