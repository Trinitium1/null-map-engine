/**
 * Deterministic Pseudo-Random Number Generator.
 * Uses a classic 2D sine wave hash function to guarantee consistent outputs 
 * for the same x, y coordinates.
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y (or Z) coordinate
 * @returns {number} A deterministic float between 0.0 and 1.0
 */
export function prng(x, y) {
    const dot = x * 12.9898 + y * 78.233;
    const sin = Math.sin(dot) * 43758.5453;
    return sin - Math.floor(sin);
}
