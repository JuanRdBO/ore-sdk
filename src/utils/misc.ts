/**
 * Splits an array into smaller chunks of a specified size.
 *
 * @template T - The type of elements in the array.
 * @param {T[]} array - The input array to be chunked.
 * @param {number} size - The size of each chunk.
 * @returns {T[][]} An array of chunks, where each chunk is an array of size `size` (except possibly the last chunk).
 */
export function chunk<T>(array: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size),
	);
}
