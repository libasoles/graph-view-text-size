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
}) {
	// Normalizar el valor al rango [0, 1]
	const normalizedValue = (value - inMin) / (inMax - inMin);

	// Aplicar una escala logarítmica
	const logScaleValue = Math.log1p(normalizedValue * 9) / Math.log(10);

	// Mapear al rango de salida
	const mappedValue = logScaleValue * (outMax - outMin) + outMin;

	// Limitar el valor mapeado al rango de salida
	return Math.min(Math.max(mappedValue, outMin), outMax);
}

export const memoize = <T = any>(fn: Func<T>) => {
	const cache = new Map();
	const cached = function (this: any, val: T) {
		return cache.has(val)
			? cache.get(val)
			: cache.set(val, fn.call(this, val)) && cache.get(val);
	};
	cached.cache = cache;
	return cached;
};
