export class ConflitError extends Error {
	constructor(message?: string) {
		super(message ?? "Conflit.");
	}
}
