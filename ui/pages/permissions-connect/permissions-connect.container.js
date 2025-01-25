import { SubjectType } from '@metamask/permission-controller';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { isEvmAccountType } from '@metamask/keyring-api';
import { Caip25EndowmentPermissionName } from '@metamask/multichain';
import {
  getAccountsWithLabels,
  getLastConnectedInfo,
  getPermissionsRequests,
  getSelectedInternalAccount,
  getSnapInstallOrUpdateRequests,
  getRequestState,
  getSnapsInstallPrivacyWarningShown,
  getRequestType,
  getTargetSubjectMetadata,
} from '../../selectors';
import { getNativeCurrency } from '../../ducks/metamask/metamask';

import { formatDate, getURLHostName } from '../../helpers/utils/util';
import {
  approvePermissionsRequest,
  rejectPermissionsRequest,
  showModal,
  getRequestAccountTabIds,
  resolvePendingApproval,
  rejectPendingApproval,
  setSnapsInstallPrivacyWarningShownStatus,
} from '../../store/actions';
import {
  CONNECT_ROUTE,
  CONNECT_CONFIRM_PERMISSIONS_ROUTE,
  CONNECT_SNAPS_CONNECT_ROUTE,
  CONNECT_SNAP_INSTALL_ROUTE,
  CONNECT_SNAP_UPDATE_ROUTE,
  CONNECT_SNAP_RESULT_ROUTE,
} from '../../helpers/constants/routes';
import PermissionApproval from './permissions-connect.component';

const mapStateToProps = (state, ownProps) => {
  const {
    match: {
      params: { id: permissionsRequestId },
    },
    location: { pathname },
  } = ownProps;
  let permissionsRequests = getPermissionsRequests(state);
  permissionsRequests = [
    ...permissionsRequests,
    ...getSnapInstallOrUpdateRequests(state),
  ];
  const { address: currentAddress } = getSelectedInternalAccount(state);

  const permissionsRequest = permissionsRequests.find(
    (req) => req.metadata.id === permissionsRequestId,
  );

  // FIX: `wallet_switchEthereumChain` goes to `ConnectPage` instead of `PermissionPageContainer`
  // Some stuff is rendered on `main` that is NOT rendered on this branch. Also, on main, `isRequestingAccounts` evaluates to false,
  // so on `ui/pages/permissions-connect/permissions-connect.component.js`, l151 we go to `history.replace(confirmPermissionPath)`;
  // we should find a solution for specifically triggering `wallet_switchEthereumChain` to also go in here (check `state` here perhaps ?)
  // Problem 1: We need to differentiate in this component, a legacy `wallet_switchEthereumChain` from any other regular caip25 request
  // Problem 2: `permission.js` file, `PERMISSION_DESCRIPTIONS` object, needs to differentiate legacey wallet_switchEthereumChain from a regular caip25 request
  // [Caip25EndowmentPermissionName]: ({ t }) => ({
  //   label: t('permission_ethereumAccounts'), <----
  //   leftIcon: IconName.Eye,
  //   weight: PermissionWeight.eth_accounts,
  // }),
  // // "eth_accounts" entry is needed for the Snaps Permissions Grant UI
  // [RestrictedMethods.eth_accounts]: ({ t }) => ({
  //   label: t('permission_ethereumAccounts'), <-----
  //   leftIcon: IconName.Eye,
  //   weight: PermissionWeight.eth_accounts,
  // }),
  // [PermissionNames.permittedChains]: ({ t }) => ({
  //   label: t('permission_walletSwitchEthereumChain'), <-----
  //   leftIcon: IconName.Wifi,
  //   weight: PermissionWeight.permittedChains,
  // }),
  // await window.ethereum.request({
  //     jsonrpc: '2.0',
  //     method: 'wallet_switchEthereumChain',
  //     params: [{ chainId: '0x1' }],
  //   })
  const isRequestingAccounts = Boolean(
    permissionsRequest?.permissions?.[Caip25EndowmentPermissionName],
  );

  const { metadata = {} } = permissionsRequest || {};
  const { origin } = metadata;
  const nativeCurrency = getNativeCurrency(state);

  const targetSubjectMetadata = getTargetSubjectMetadata(state, origin) ?? {
    name: getURLHostName(origin) || origin,
    origin,
    iconUrl: null,
    extensionId: null,
    subjectType: SubjectType.Unknown,
  };

  let requestType = getRequestType(state, permissionsRequestId);

  // We want to only assign the wallet_connectSnaps request type (i.e. only show
  // SnapsConnect) if and only if we get a singular wallet_snap permission request.
  // Any other request gets pushed to the normal permission connect flow.
  if (
    permissionsRequest &&
    Object.keys(permissionsRequest.permissions || {}).length === 1 &&
    permissionsRequest.permissions?.[WALLET_SNAP_PERMISSION_KEY]
  ) {
    requestType = 'wallet_connectSnaps';
  }

  const requestState = getRequestState(state, permissionsRequestId) || {};

  // We only consider EVM accounts.
  // Connections with non-EVM accounts (Bitcoin only for now) are used implicitly and handled by the Bitcoin Snap itself.
  const accountsWithLabels = getAccountsWithLabels(state).filter((account) =>
    isEvmAccountType(account.type),
  );

  const lastConnectedInfo = getLastConnectedInfo(state) || {};
  const addressLastConnectedMap = lastConnectedInfo[origin]?.accounts || {};

  Object.keys(addressLastConnectedMap).forEach((key) => {
    addressLastConnectedMap[key] = formatDate(
      addressLastConnectedMap[key],
      'yyyy-MM-dd',
    );
  });

  const connectPath = `${CONNECT_ROUTE}/${permissionsRequestId}`;
  const confirmPermissionPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_CONFIRM_PERMISSIONS_ROUTE}`;
  const snapsConnectPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAPS_CONNECT_ROUTE}`;
  const snapInstallPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_INSTALL_ROUTE}`;
  const snapUpdatePath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_UPDATE_ROUTE}`;
  const snapResultPath = `${CONNECT_ROUTE}/${permissionsRequestId}${CONNECT_SNAP_RESULT_ROUTE}`;
  const isSnapInstallOrUpdateOrResult =
    pathname === snapInstallPath ||
    pathname === snapUpdatePath ||
    pathname === snapResultPath;

  let totalPages = 1 + isRequestingAccounts;
  totalPages += isSnapInstallOrUpdateOrResult;
  totalPages = totalPages.toString();

  let page = '';
  if (pathname === connectPath) {
    page = '1';
  } else if (pathname === confirmPermissionPath) {
    page = isRequestingAccounts ? '2' : '1';
  } else if (isSnapInstallOrUpdateOrResult) {
    page = isRequestingAccounts ? '3' : '2';
  } else if (pathname === snapsConnectPath) {
    page = 1;
  } else {
    throw new Error('Incorrect path for permissions-connect component');
  }

  return {
    isRequestingAccounts,
    requestType,
    snapsConnectPath,
    snapInstallPath,
    snapUpdatePath,
    snapResultPath,
    requestState,
    hideTopBar: isSnapInstallOrUpdateOrResult,
    snapsInstallPrivacyWarningShown: getSnapsInstallPrivacyWarningShown(state),
    permissionsRequest,
    permissionsRequestId,
    accounts: accountsWithLabels,
    currentAddress,
    origin,
    newAccountNumber: accountsWithLabels.length + 1,
    nativeCurrency,
    addressLastConnectedMap,
    lastConnectedInfo,
    connectPath,
    confirmPermissionPath,
    totalPages,
    page,
    targetSubjectMetadata,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    approvePermissionsRequest: (request) =>
      dispatch(approvePermissionsRequest(request)),
    rejectPermissionsRequest: (requestId) =>
      dispatch(rejectPermissionsRequest(requestId)),
    approvePendingApproval: (id, value) =>
      dispatch(resolvePendingApproval(id, value)),
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    setSnapsInstallPrivacyWarningShownStatus: (shown) => {
      dispatch(setSnapsInstallPrivacyWarningShownStatus(shown));
    },
    showNewAccountModal: ({ onCreateNewAccount, newAccountNumber }) => {
      return dispatch(
        showModal({
          name: 'NEW_ACCOUNT',
          onCreateNewAccount,
          newAccountNumber,
        }),
      );
    },
    getRequestAccountTabIds: () => dispatch(getRequestAccountTabIds()),
  };
};

const PermissionApprovalContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PermissionApproval);

PermissionApprovalContainer.propTypes = {
  history: PropTypes.object.isRequired,
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

export default PermissionApprovalContainer;
