import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  isBtcMainnetAddress,
  isBtcTestnetAddress,
} from '../../shared/lib/multichain';
import type { BackgroundStateProxy } from '../../shared/types/background';

type AccountsState = {
  metamask: Pick<BackgroundStateProxy, 'AccountsController'>;
};

function isBtcAccount(account: InternalAccount) {
  const { P2wpkh } = BtcAccountType;

  return Boolean(account && account.type === P2wpkh);
}

function isSolanaAccount(account: InternalAccount) {
  const { DataAccount } = SolAccountType;

  return Boolean(account && account.type === DataAccount);
}

export function getInternalAccounts(state: AccountsState) {
  return Object.values(
    state.metamask.AccountsController.internalAccounts.accounts,
  );
}

export function getSelectedInternalAccount(state: AccountsState) {
  const accountId =
    state.metamask.AccountsController.internalAccounts.selectedAccount;
  return state.metamask.AccountsController.internalAccounts.accounts[accountId];
}

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountBtc(state: AccountsState) {
  return isBtcAccount(getSelectedInternalAccount(state));
}

export function isSelectedInternalAccountSolana(state: AccountsState) {
  return isSolanaAccount(getSelectedInternalAccount(state));
}

function hasCreatedBtcAccount(
  state: AccountsState,
  isAddressCallback: (address: string) => boolean,
) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => {
    return isBtcAccount(account) && isAddressCallback(account.address);
  });
}

export function hasCreatedBtcMainnetAccount(state: AccountsState) {
  return hasCreatedBtcAccount(state, isBtcMainnetAddress);
}

export function hasCreatedBtcTestnetAccount(state: AccountsState) {
  return hasCreatedBtcAccount(state, isBtcTestnetAddress);
}
