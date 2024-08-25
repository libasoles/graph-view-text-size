export function mapValue({
	value,
	inMin,
	inMax,
	outMin,
	outMax,
}: {
	value: number;
	inMin: number;
	inMax: number;
	outMin: number;
	outMax: number;
}): number {
	return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export const memoize = <R, P>(fn: (val: P) => R) => {
	const cache = new Map<string, R>();

	const cached = function (val: P): R {
		const hash = JSON.stringify(val);
		return cache.has(hash)
			? (cache.get(hash) as R)
			: cache.set(hash, fn(val)) && (cache.get(hash) as R);
	};

	return cached;
};

export function calculateFontSize({
	fontSize,
	multiplier,
}: {
	fontSize: number;
	multiplier: number;
}): number {
	return Math.ceil(fontSize * multiplier);
}
