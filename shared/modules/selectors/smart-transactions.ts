import { createSelector } from 'reselect';
import {
  getAllowedSmartTransactionsChainIds,
  SKIP_STX_RPC_URL_CHECK_CHAIN_IDS,
} from '../../constants/smartTransactions';
import {
  getCurrentNetwork,
  accountSupportsSmartTx,
  getPreferences,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../ui/selectors/selectors'; // TODO: Migrate shared selectors to this file.
import { isProduction } from '../environment';
import { getCurrentChainId, NetworkState } from './networks';

type SmartTransactionsMetaMaskState = {
  metamask: {
    preferences: {
      smartTransactionsOptInStatus?: boolean;
      smartTransactionsMigrationApplied?: boolean;
    };
    internalAccounts: {
      selectedAccount: string;
      accounts: {
        [key: string]: {
          metadata: {
            keyring: {
              type: string;
            };
          };
        };
      };
    };
    swapsState: {
      swapsFeatureFlags: {
        ethereum: {
          extensionActive: boolean;
          mobileActive: boolean;
          smartTransactions: {
            expectedDeadline?: number;
            maxDeadline?: number;
            extensionReturnTxHashAsap?: boolean;
          };
        };
        smartTransactions: {
          extensionActive: boolean;
          mobileActive: boolean;
        };
      };
    };
    smartTransactionsState: {
      liveness: boolean;
    };
  };
};

/**
 * Returns the user's explicit opt-in status for the smart transactions feature.
 * This should only be used for reading the user's internal opt-in status, and
 * not for determining if the smart transactions user preference is enabled.
 *
 * To determine if the smart transactions user preference is enabled, use
 * getSmartTransactionsPreferenceEnabled instead.
 *
 * @param state - The state object.
 * @returns true if the user has explicitly opted in, false if they have opted out,
 * or null if they have not explicitly opted in or out.
 */
export const getSmartTransactionsOptInStatusInternal = createSelector(
  getPreferences,
  (preferences: { smartTransactionsOptInStatus?: boolean }): boolean => {
    return preferences?.smartTransactionsOptInStatus ?? true;
  },
);

/**
 * Returns whether the smart transactions migration has been applied to the user's settings.
 * This specifically tracks if Migration 135 has been run, which enables Smart Transactions
 * by default for users who have never interacted with the feature or who previously opted out
 * with no STX activity.
 *
 * This should only be used for internal checks of the migration status, and not
 * for determining overall Smart Transactions availability.
 *
 * @param state - The state object.
 * @returns true if the migration has been applied to the user's settings, false if not or if unset.
 */
export const getSmartTransactionsMigrationAppliedInternal = createSelector(
  getPreferences,
  (preferences: { smartTransactionsMigrationApplied?: boolean }): boolean => {
    return preferences?.smartTransactionsMigrationApplied ?? false;
  },
);

/**
 * Returns the user's explicit opt-in status for the smart transactions feature.
 * This should only be used for metrics collection, and not for determining if the
 * smart transactions user preference is enabled.
 *
 * To determine if the smart transactions user preference is enabled, use
 * getSmartTransactionsPreferenceEnabled instead.
 *
 * @param state - The state object.
 * @returns true if the user has explicitly opted in, false if they have opted out,
 * or null if they have not explicitly opted in or out.
 */
// @ts-expect-error TODO: Fix types for `getSmartTransactionsOptInStatusInternal` once `getPreferences is converted to TypeScript
export const getSmartTransactionsOptInStatusForMetrics = createSelector(
  getSmartTransactionsOptInStatusInternal,
  (optInStatus: boolean): boolean => optInStatus,
);

/**
 * Returns the user's preference for the smart transactions feature.
 * Defaults to `true` if the user has not set a preference.
 *
 * @param state
 * @returns
 */
// @ts-expect-error TODO: Fix types for `getSmartTransactionsOptInStatusInternal` once `getPreferences is converted to TypeScript
export const getSmartTransactionsPreferenceEnabled = createSelector(
  getSmartTransactionsOptInStatusInternal,
  (optInStatus: boolean): boolean => {
    // In the absence of an explicit opt-in or opt-out,
    // the Smart Transactions toggle is enabled.
    const DEFAULT_SMART_TRANSACTIONS_ENABLED = true;
    return optInStatus ?? DEFAULT_SMART_TRANSACTIONS_ENABLED;
  },
);

export const getCurrentChainSupportsSmartTransactions = (
  state: NetworkState,
): boolean => {
  const chainId = getCurrentChainId(state);
  return getAllowedSmartTransactionsChainIds().includes(chainId);
};

const getIsAllowedRpcUrlForSmartTransactions = (state: NetworkState) => {
  const chainId = getCurrentChainId(state);
  // Allow in non-production or if chain ID is on skip list.
  if (!isProduction() || SKIP_STX_RPC_URL_CHECK_CHAIN_IDS.includes(chainId)) {
    return true;
  }
  const rpcUrl = getCurrentNetwork(state)?.rpcUrl;
  if (!rpcUrl) {
    return false;
  }
  const { hostname } = new URL(rpcUrl);
  if (!hostname) {
    return false;
  }
  return hostname.endsWith('.infura.io') || hostname.endsWith('.binance.org');
};

export const getSmartTransactionsEnabled = (
  state: SmartTransactionsMetaMaskState & NetworkState,
): boolean => {
  const supportedAccount = accountSupportsSmartTx(state);
  // TODO: Create a new proxy service only for MM feature flags.
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    getCurrentChainSupportsSmartTransactions(state) &&
      getIsAllowedRpcUrlForSmartTransactions(state) &&
      supportedAccount &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getIsSmartTransaction = (
  state: SmartTransactionsMetaMaskState & NetworkState,
): boolean => {
  const smartTransactionsPreferenceEnabled =
    getSmartTransactionsPreferenceEnabled(state);
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  return Boolean(
    smartTransactionsPreferenceEnabled && smartTransactionsEnabled,
  );
};
