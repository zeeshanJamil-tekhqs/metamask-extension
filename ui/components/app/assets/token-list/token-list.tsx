import React, { ReactNode, useEffect, useMemo } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import { Hex } from '@metamask/utils';
import TokenCell from '../token-cell';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
import { sortAssets } from '../util/sort';
import {
  getChainIdsToPoll,
  getCurrencyRates,
  getCurrentNetwork,
  getIsTestnet,
  getIsTokenNetworkFilterEqualCurrentNetwork,
  getMarketData,
  getNetworkConfigurationIdByChainId,
  getNewTokensImported,
  getPreferences,
  getSelectedAccount,
  getSelectedAccountNativeTokenCachedBalanceByChainId,
  getSelectedAccountTokensAcrossChains,
  getShowFiatInTestnets,
  getTokenExchangeRates,
  getTokenNetworkFilter,
} from '../../../../selectors';
import { getConversionRate } from '../../../../ducks/metamask/metamask';
import { filterAssets } from '../util/filter';
import { endTrace, TraceName } from '../../../../../shared/lib/trace';
import { useTokenBalances } from '../../../../hooks/useTokenBalances';
import { setTokenNetworkFilter } from '../../../../store/actions';
import { useMultichainSelector } from '../../../../hooks/useMultichainSelector';
import { getMultichainShouldShowFiat } from '../../../../selectors/multichain';
import { consolidateTokenBalances } from '../util/consolidateTokenBalances';

type TokenListProps = {
  onTokenClick: (chainId: string, address: string) => void;
  nativeToken?: ReactNode;
};

export type Token = {
  address: Hex;
  aggregators: string[];
  chainId: Hex;
  decimals: number;
  isNative: boolean;
  symbol: string;
  image: string;
};

export type TokenWithFiatAmount = Token & {
  tokenFiatAmount: number | null;
  balance?: string;
  string: string; // needed for backwards compatability TODO: fix this
};

export type AddressBalanceMapping = Record<Hex, Record<Hex, Hex>>;
export type ChainAddressMarketData = Record<
  Hex,
  Record<Hex, Record<string, string | number>>
>;

const useFilteredAccountTokens = (currentNetwork: { chainId: string }) => {
  const isTestNetwork = useMemo(() => {
    return (TEST_CHAINS as string[]).includes(currentNetwork.chainId);
  }, [currentNetwork.chainId, TEST_CHAINS]);

  const selectedAccountTokensChains: Record<string, Token[]> = useSelector(
    getSelectedAccountTokensAcrossChains,
  ) as Record<string, Token[]>;

  const filteredAccountTokensChains = useMemo(() => {
    return Object.fromEntries(
      Object.entries(selectedAccountTokensChains).filter(([chainId]) =>
        isTestNetwork
          ? (TEST_CHAINS as string[]).includes(chainId)
          : !(TEST_CHAINS as string[]).includes(chainId),
      ),
    );
  }, [selectedAccountTokensChains, isTestNetwork, TEST_CHAINS]);

  return filteredAccountTokensChains;
};

export default function TokenList({
  onTokenClick,
  nativeToken,
}: TokenListProps) {
  const dispatch = useDispatch();
  const currentNetwork = useSelector(getCurrentNetwork);
  const allNetworks = useSelector(getNetworkConfigurationIdByChainId);
  const { tokenSortConfig, privacyMode, hideZeroBalanceTokens } =
    useSelector(getPreferences);
  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);
  const selectedAccount = useSelector(getSelectedAccount);
  const conversionRate = useSelector(getConversionRate);
  const chainIdsToPoll = useSelector(getChainIdsToPoll);
  const contractExchangeRates = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const newTokensImported = useSelector(getNewTokensImported);
  const selectedAccountTokensChains = useFilteredAccountTokens(currentNetwork);
  const isOnCurrentNetwork = useSelector(
    getIsTokenNetworkFilterEqualCurrentNetwork,
  );

  const { tokenBalances } = useTokenBalances({
    chainIds: chainIdsToPoll as Hex[],
  });
  const selectedAccountTokenBalancesAcrossChains =
    tokenBalances[selectedAccount.address];

  const marketData: ChainAddressMarketData = useSelector(
    getMarketData,
  ) as ChainAddressMarketData;

  const currencyRates = useSelector(getCurrencyRates);
  const nativeBalances: Record<Hex, Hex> = useSelector(
    getSelectedAccountNativeTokenCachedBalanceByChainId,
  ) as Record<Hex, Hex>;
  const isTestnet = useSelector(getIsTestnet);
  // Ensure newly added networks are included in the tokenNetworkFilter
  useEffect(() => {
    if (process.env.PORTFOLIO_VIEW) {
      const allNetworkFilters = Object.fromEntries(
        Object.keys(allNetworks).map((chainId) => [chainId, true]),
      );
      if (Object.keys(tokenNetworkFilter).length > 1) {
        dispatch(setTokenNetworkFilter(allNetworkFilters));
      }
    }
  }, [Object.keys(allNetworks).length]);

  const sortedFilteredTokens = useMemo(() => {
    const consolidatedTokensWithBalances = consolidateTokenBalances(
      selectedAccountTokensChains,
      nativeBalances,
      selectedAccountTokenBalancesAcrossChains,
      marketData,
      currencyRates,
      hideZeroBalanceTokens,
      isOnCurrentNetwork,
    );
    const filteredAssets = filterAssets(consolidatedTokensWithBalances, [
      {
        key: 'chainId',
        opts: tokenNetworkFilter,
        filterCallback: 'inclusive',
      },
    ]);

    const { nativeTokens, nonNativeTokens } = filteredAssets.reduce<{
      nativeTokens: TokenWithFiatAmount[];
      nonNativeTokens: TokenWithFiatAmount[];
    }>(
      (acc, token) => {
        if (token.isNative) {
          acc.nativeTokens.push(token);
        } else {
          acc.nonNativeTokens.push(token);
        }
        return acc;
      },
      { nativeTokens: [], nonNativeTokens: [] },
    );
    const assets = [...nativeTokens, ...nonNativeTokens];
    return sortAssets(assets, tokenSortConfig);
  }, [
    tokenSortConfig,
    tokenNetworkFilter,
    conversionRate,
    contractExchangeRates,
    currentNetwork,
    selectedAccount,
    selectedAccountTokensChains,
    newTokensImported,
  ]);

  useEffect(() => {
    if (sortedFilteredTokens) {
      endTrace({ name: TraceName.AccountOverviewAssetListTab });
    }
  }, [sortedFilteredTokens]);

  // Displays nativeToken if provided
  if (nativeToken) {
    return React.cloneElement(nativeToken as React.ReactElement);
  }

  const shouldShowFiat = useMultichainSelector(
    getMultichainShouldShowFiat,
    selectedAccount,
  );
  const isMainnet = !isTestnet;
  // Check if show conversion is enabled
  const showFiatInTestnets = useSelector(getShowFiatInTestnets);
  const showFiat =
    shouldShowFiat && (isMainnet || (isTestnet && showFiatInTestnets));

  return (
    <div>
      {sortedFilteredTokens.map((tokenData) => (
        <TokenCell
          key={`${tokenData.chainId}-${tokenData.symbol}-${tokenData.address}`}
          chainId={tokenData.chainId}
          address={tokenData.address}
          symbol={tokenData.symbol}
          tokenFiatAmount={showFiat ? tokenData.tokenFiatAmount : null}
          image={tokenData?.image}
          isNative={tokenData.isNative}
          string={tokenData.string}
          privacyMode={privacyMode}
          onClick={onTokenClick}
        />
      ))}
    </div>
  );
}
