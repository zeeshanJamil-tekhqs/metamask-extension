import { shallowEqual, useSelector } from 'react-redux';
import { toChecksumAddress } from 'ethereumjs-util';
import {
  getCurrentCurrency,
  getNetworkConfigurationsByChainId,
  getCrossChainTokenExchangeRates,
  getCrossChainMetaMaskCachedBalances,
} from '../selectors';
import {
  getValueFromWeiHex,
  sumDecimals,
} from '../../shared/modules/conversion.utils';
import { getCurrencyRates } from '../ducks/metamask/metamask';
import { getTokenFiatAmount } from '../helpers/utils/token-util';
import { TokenWithBalance } from '../components/app/assets/asset-list/asset-list';

type AddressBalances = {
  [address: string]: number;
};

export type Balances = {
  [id: string]: AddressBalances;
};

export const useAccountTotalCrossChainFiatBalance = (
  account: { address: string },
  formattedTokensWithBalancesPerChain: {
    chainId: string;
    tokensWithBalances: TokenWithBalance[];
  }[],
) => {
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const currencyRates = useSelector(getCurrencyRates);
  const currentCurrency = useSelector(getCurrentCurrency);

  const crossChainContractRates = useSelector(
    getCrossChainTokenExchangeRates,
    shallowEqual,
  );

  const crossChainCachedBalances: Balances = useSelector(
    getCrossChainMetaMaskCachedBalances,
  );

  // const loading = false; //todo check if loading is still needed

  const mergedCrossChainRates: Balances = {
    ...crossChainContractRates, // todo add confirmation exchange rates?
  };

  const tokenFiatBalancesCrossChains = formattedTokensWithBalancesPerChain.map(
    (singleChainTokenBalances) => {
      const { tokensWithBalances } = singleChainTokenBalances;
      const matchedChainSymbol =
        allNetworks[singleChainTokenBalances.chainId as `0x${string}`]
          .nativeCurrency;
      const conversionRate =
        currencyRates?.[matchedChainSymbol]?.conversionRate;
      const tokenFiatBalances = tokensWithBalances.map((token) => {
        const tokenExchangeRate =
          mergedCrossChainRates[singleChainTokenBalances.chainId][
            toChecksumAddress(token.address)
          ];
        const totalFiatValue = getTokenFiatAmount(
          tokenExchangeRate,
          conversionRate,
          currentCurrency,
          token.string,
          token.symbol,
          false,
          false,
        );

        return totalFiatValue;
      });

      const balanceCached =
        crossChainCachedBalances?.[singleChainTokenBalances.chainId]?.[
          account?.address
        ] ?? 0;
      const nativeFiatValue = getValueFromWeiHex({
        value: balanceCached,
        toCurrency: currentCurrency,
        conversionRate,
        numberOfDecimals: 2,
      });
      return {
        ...singleChainTokenBalances,
        tokenFiatBalances,
        nativeFiatValue,
      };
    },
  );

  const finalTotal = tokenFiatBalancesCrossChains.reduce(
    (accumulator, currentValue) => {
      const tmpCurrentValueFiatBalances = currentValue.tokenFiatBalances.filter(
        (value) => value !== undefined,
      );
      const totalFiatBalance = sumDecimals(
        currentValue.nativeFiatValue,
        ...tmpCurrentValueFiatBalances,
      );

      const totalAsNumber = totalFiatBalance.toNumber
        ? totalFiatBalance.toNumber()
        : Number(totalFiatBalance);

      return accumulator + totalAsNumber;
    },
    0,
  );

  return {
    totalFiatBalance: finalTotal.toString(10),
    tokenFiatBalancesCrossChains,
  };
};
