/**
 * The parts of d3 improve's charts use, for the build to import in place of
 * all of d3: d3's index also loads d3-transition, which changes d3-selection
 * as it loads, so a bundle cannot leave either out on its own.
 */
export { group, max } from "d3-array";
export { scaleLinear, scaleOrdinal } from "d3-scale";
export { curveMonotoneX, line } from "d3-shape";
