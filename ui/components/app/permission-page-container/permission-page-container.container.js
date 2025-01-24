import { connect } from 'react-redux';
import {
  getInternalAccounts,
  getPermissions,
  getSelectedInternalAccount,
} from '../../../selectors';
import PermissionPageContainer from './permission-page-container.component';

const mapStateToProps = (state, ownProps) => {
  const { selectedAccounts } = ownProps;
  const currentPermissions = getPermissions(
    state,
    ownProps.request.metadata?.origin,
  );
  const defaultAccountAddress = getSelectedInternalAccount(state).address;

  const allInternalAccounts = getInternalAccounts(state);
  const allInternalAccountsSelected =
    Object.keys(selectedAccounts).length ===
      Object.keys(allInternalAccounts).length && selectedAccounts.length > 1;

  return {
    allInternalAccountsSelected,
    currentPermissions,
    defaultAccountAddress,
  };
};

export default connect(mapStateToProps)(PermissionPageContainer);
