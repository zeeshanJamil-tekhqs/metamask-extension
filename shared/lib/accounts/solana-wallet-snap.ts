import { SnapId } from '@metamask/snaps-sdk';
// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).

export const SOLANA_WALLET_SNAP_ID = 'local:http://localhost:8080';
// export const SOLANA_WALLET_SNAP_ID: SnapId = SolanaWalletSnap.snapId as SnapId;

export const SOLANA_WALLET_NAME: string = 'SOLANA';
