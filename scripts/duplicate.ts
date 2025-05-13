/// <reference types="bun-types" />
/// <reference types="node" />

import path from 'node:path';
import { argv, exit, cwd } from 'node:process';

const getChainIdFromArgs = (): string | null => {
    const args = argv;
    const chainIdArg = args.find(arg => arg.startsWith('--chainId='));
    if (chainIdArg) {
        return chainIdArg.split('=')[1];
    }
    return null;
};

const newChainIdString = getChainIdFromArgs();

if (!newChainIdString) {
    console.error('Error: --chainId argument is missing. Please provide it like --chainId=12345');
    exit(1);
}

const newChainIdNum = parseInt(newChainIdString!, 10);
if (isNaN(newChainIdNum)) {
    console.error('Error: --chainId must be a number.');
    exit(1);
}

const sourceFilePath = path.resolve(cwd(), 'chains-testnet/84532.json');
const targetDirectory = path.resolve(cwd(), 'chains-testnet');
const targetFilePath = path.join(targetDirectory, `${newChainIdString}.json`);

async function main() {
    try {
        const sourceFile = Bun.file(sourceFilePath);
        const sourceContent = await sourceFile.text();
        const chainConfig = JSON.parse(sourceContent);

        const originalRpcFromTemplate = chainConfig.rpc; // Store original RPC for logging

        // Modify the configuration
        chainConfig.name = newChainIdString;
        chainConfig.chainId = newChainIdString;

        // Replace specific placeholder for RPC URL
        const placeholderRpc = "<YOUR RPC URL (debug_traceCall enabled)>";
        if (chainConfig.rpc === placeholderRpc) {
            chainConfig.rpc = `http://host.docker.internal:${newChainIdString}`;
        }
        // Note: The previous rpc update logic (checking for .includes('84532')) is now replaced by this specific placeholder check.

        const newJsonContent = JSON.stringify(chainConfig, null, 4); // Pretty print JSON with 4 spaces

        await Bun.write(targetFilePath, newJsonContent);

        console.log(`Successfully duplicated and updated chain config to ${targetFilePath}`);
        if (originalRpcFromTemplate !== chainConfig.rpc) {
            console.log(`RPC in new file: ${chainConfig.rpc} (changed from: ${originalRpcFromTemplate})`);
        } else {
            console.log(`RPC in new file: ${chainConfig.rpc} (unchanged from template)`);
        }

    } catch (error) {
        if (error instanceof Error) {
            console.error(`An error occurred: ${error.message}`);
        } else {
            console.error('An unknown error occurred.');
        }
        exit(1);
    }
}

main(); 