import {
  NetworkState,
  getCurrentChainId,
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../ui/selectors/networks'; // TODO: Migrate shared selectors to this file.
import { getNetworkNameByChainId } from '../feature-flags';

type FeatureFlagsMetaMaskState = {
  metamask: {
    swapsState: {
      swapsFeatureFlags: {
        [key: string]: {
          extensionActive: boolean;
          mobileActive: boolean;
          smartTransactions: {
            expectedDeadline?: number;
            maxDeadline?: number;
            returnTxHashAsap?: boolean;
          };
        };
      };
    };
  };
};

export function getFeatureFlagsByChainId(
  state: NetworkState & FeatureFlagsMetaMaskState,
) {
  const chainId = getCurrentChainId(state);
  const networkName = getNetworkNameByChainId(chainId);
  const featureFlags = state.metamask.swapsState?.swapsFeatureFlags;
  if (!featureFlags?.[networkName]) {
    return null;
  }
  return {
    smartTransactions: {
      ...featureFlags.smartTransactions,
      ...featureFlags[networkName].smartTransactions,
    },
  };
}
