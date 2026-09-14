export type VerifiedClerkWebhook = {
	type: string;
	data: { id?: unknown };
};

export type AccountErasureConfig = {
	maxAttempts: number;
	processingTimeoutSeconds: number;
	quietPeriodSeconds: number;
};
