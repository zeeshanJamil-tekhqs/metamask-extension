import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  SnapCaveatType,
  WALLET_SNAP_PERMISSION_KEY,
} from '@metamask/snaps-rpc-methods';
import {
  Caip25EndowmentPermissionName,
  getPermittedEthChainIds,
} from '@metamask/multichain';
import { SubjectType } from '@metamask/permission-controller';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { PageContainerFooter } from '../../ui/page-container';
import PermissionsConnectFooter from '../permissions-connect-footer';
import { RestrictedMethods } from '../../../../shared/constants/permissions';

import SnapPrivacyWarning from '../snaps/snap-privacy-warning';
import { getDedupedSnaps } from '../../../helpers/utils/util';

import {
  BackgroundColor,
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import { Box } from '../../component-library';
import { getSelectedInternalAccount } from '../../../selectors';
import {
  getRequestedSessionScopes,
  parseCaip25PermissionsResponse,
} from '../../../pages/permissions-connect/connect-page/utils';
import { containsEthPermissionsAndNonEvmAccount } from '../../../helpers/utils/permissions';
import { PermissionPageContainerContent } from '.';

class PermissionPageContainer extends Component {
  static propTypes = {
    approvePermissionsRequest: PropTypes.func.isRequired,
    rejectPermissionsRequest: PropTypes.func.isRequired,
    selectedAccounts: PropTypes.array,
    requestedChainIds: PropTypes.array,
    allAccountsSelected: PropTypes.bool,
    currentPermissions: PropTypes.object,
    snapsInstallPrivacyWarningShown: PropTypes.bool.isRequired,
    setSnapsInstallPrivacyWarningShownStatus: PropTypes.func,
    request: PropTypes.object,
    requestMetadata: PropTypes.object,
    targetSubjectMetadata: PropTypes.shape({
      name: PropTypes.string,
      origin: PropTypes.string.isRequired,
      subjectType: PropTypes.string.isRequired,
      extensionId: PropTypes.string,
      iconUrl: PropTypes.string,
    }),
    history: PropTypes.object.isRequired,
    connectPath: PropTypes.string.isRequired,
    defaultAccount: PropTypes.string,
  };

  static defaultProps = {
    request: {},
    requestMetadata: {},
    selectedAccounts: [],
    allAccountsSelected: false,
    currentPermissions: {},
    defaultAccount: '',
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  state = {};

  getRequestedPermissions() {
    const { request } = this.props;

    // if the request contains a diff this means its an incremental permission request
    const permissions =
      request?.diff?.permissionDiffMap ?? request.permissions ?? {};

    return Object.entries(permissions).reduce(
      (acc, [permissionName, permissionValue]) => {
        if (permissionName === RestrictedMethods.wallet_snap) {
          acc[permissionName] = this.getDedupedSnapPermissions();
          return acc;
        }
        acc[permissionName] = permissionValue;
        return acc;
      },
      {},
    );
  }

  getDedupedSnapPermissions() {
    const { request, currentPermissions } = this.props;
    const snapKeys = getDedupedSnaps(request, currentPermissions);
    const permission = request?.permissions?.[WALLET_SNAP_PERMISSION_KEY] || {};
    return {
      ...permission,
      caveats: [
        {
          type: SnapCaveatType.SnapIds,
          value: snapKeys.reduce((caveatValue, snapId) => {
            caveatValue[snapId] = {};
            return caveatValue;
          }, {}),
        },
      ],
    };
  }

  showSnapsPrivacyWarning() {
    this.setState({
      isShowingSnapsPrivacyWarning: true,
    });
  }

  componentDidMount() {
    this.context.trackEvent({
      category: MetaMetricsEventCategory.Auth,
      event: 'Tab Opened',
      properties: {
        action: 'Connect',
        legacy_event: true,
      },
    });

    if (this.props.request.permissions[WALLET_SNAP_PERMISSION_KEY]) {
      if (this.props.snapsInstallPrivacyWarningShown === false) {
        this.showSnapsPrivacyWarning();
      }
    }
  }

  goBack() {
    const { history, connectPath } = this.props;
    history.push(connectPath);
  }

  onCancel = () => {
    const { request, rejectPermissionsRequest } = this.props;
    rejectPermissionsRequest(request.metadata.id);
  };

  onSubmit = () => {
    const {
      request: _request,
      approvePermissionsRequest,
      rejectPermissionsRequest,
      selectedAccounts,
      defaultAccount,
    } = this.props;

    const approvedAccounts =
      selectedAccounts.length > 0
        ? selectedAccounts.map((selectedAccount) => selectedAccount.address)
        : [defaultAccount];

    const requestedSessionsScopes = getRequestedSessionScopes(
      _request.permission,
    );
    const approvedChainIds = getPermittedEthChainIds(requestedSessionsScopes);

    const request = {
      ..._request,
      permissions: { ..._request.permissions },
      response: parseCaip25PermissionsResponse(
        approvedAccounts,
        approvedChainIds,
      ),
    };

    if (Object.keys(request.response.permissions).length > 0) {
      approvePermissionsRequest(request);
    } else {
      rejectPermissionsRequest(request.metadata.id);
    }
  };

  onLeftFooterClick = () => {
    const requestedPermissions = this.getRequestedPermissions();
    if (requestedPermissions[Caip25EndowmentPermissionName] === undefined) {
      this.goBack();
    } else {
      this.onCancel();
    }
  };

  render() {
    const {
      requestMetadata,
      targetSubjectMetadata,
      selectedAccounts,
      allAccountsSelected,
      requestedChainIds,
    } = this.props;

    const requestedPermissions = this.getRequestedPermissions();

    const setIsShowingSnapsPrivacyWarning = (value) => {
      this.setState({
        isShowingSnapsPrivacyWarning: value,
      });
    };

    const confirmSnapsPrivacyWarning = () => {
      setIsShowingSnapsPrivacyWarning(false);
      this.props.setSnapsInstallPrivacyWarningShownStatus(true);
    };

    const footerLeftActionText = requestedPermissions[
      Caip25EndowmentPermissionName
    ]
      ? this.context.t('cancel')
      : this.context.t('back');

    return (
      <>
        {this.state.isShowingSnapsPrivacyWarning && (
          <SnapPrivacyWarning
            onAccepted={() => confirmSnapsPrivacyWarning()}
            onCanceled={() => this.onCancel()}
          />
        )}
        <PermissionPageContainerContent
          requestMetadata={requestMetadata}
          subjectMetadata={targetSubjectMetadata}
          selectedPermissions={requestedPermissions}
          requestedChainIds={requestedChainIds}
          selectedAccounts={selectedAccounts}
          allAccountsSelected={allAccountsSelected}
        />
        <Box
          display={Display.Flex}
          backgroundColor={BackgroundColor.backgroundAlternative}
          flexDirection={FlexDirection.Column}
        >
          {targetSubjectMetadata?.subjectType !== SubjectType.Snap && (
            <PermissionsConnectFooter />
          )}
          <PageContainerFooter
            footerClassName="permission-page-container-footer"
            cancelButtonType="default"
            onCancel={() => this.onLeftFooterClick()}
            cancelText={footerLeftActionText}
            onSubmit={() => this.onSubmit()}
            submitText={this.context.t('confirm')}
            buttonSizeLarge={false}
            disabled={containsEthPermissionsAndNonEvmAccount(
              selectedAccounts,
              requestedPermissions,
            )}
          />
        </Box>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  defaultAccount: getSelectedInternalAccount(state).address,
});

export default connect(mapStateToProps)(PermissionPageContainer);
