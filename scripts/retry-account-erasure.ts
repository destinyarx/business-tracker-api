import 'dotenv/config';

import { databaseClient } from '../src/infrastructure/database';
import { retryFailedAccountErasure } from '../src/infrastructure/database/queries/account-erasure.queries';

async function main(): Promise<void> {
	const requestId = Number(process.argv[2]);
	if (!Number.isSafeInteger(requestId) || requestId < 1) {
		throw new Error(
			'Usage: npm run account-erasure:retry -- <positive request ID>',
		);
	}

	const restarted = await retryFailedAccountErasure(requestId);
	if (!restarted) {
		throw new Error('No failed account-erasure request found for that ID');
	}

	console.log(`Account-erasure request ${requestId} scheduled for retry`);
}

async function run(): Promise<void> {
	try {
		await main();
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : 'Retry failed';
		console.error(message);
		process.exitCode = 1;
	} finally {
		await databaseClient.end();
	}
}

void run();
