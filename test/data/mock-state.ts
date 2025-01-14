import { BackgroundStateProxy } from '../../shared/types/metamask';
import {AccountAddress} from "../../app/scripts/controllers/account-order";

const ACCOUNT_ADDRESS_ONE : AccountAddress = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const ACCOUNT_ADDRESS_TWO : AccountAddress = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';

export const mockState: BackgroundStateProxy = {
  isInitialized: true,
  AccountOrderController: {
    pinnedAccountList: [
      ACCOUNT_ADDRESS_ONE,
      ACCOUNT_ADDRESS_TWO,
    ],
    hiddenAccountList: [],
  }
  AccountTracker: {

  },
  TxController: {},
  QueuedRequestController: {}
};
