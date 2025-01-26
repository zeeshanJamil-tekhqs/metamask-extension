import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { Ganache } from '../../localNode/ganache';
import ContractAddressRegistry from '../../localNode/contract-address-registry';
import {
  multiplelocalNodeOptionsForType2Transactions,
  PRIVATE_KEY_TWO,
  withFixtures,
  WINDOW_TITLES,
} from '../../helpers';
import { SMART_CONTRACTS } from '../../localNode/smart-contracts';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SnapSimpleKeyringPage from '../../page-objects/pages/snap-simple-keyring-page';
import TestDapp from '../../page-objects/pages/test-dapp';
import { installSnapSimpleKeyring } from '../../page-objects/flows/snap-simple-keyring.flow';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Snap Account Contract interaction', function (this: Suite) {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;
  it('deposits to piggybank contract', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerSnapAccountConnectedToTestDapp()
          .build(),
        localNodeOptions: multiplelocalNodeOptionsForType2Transactions,
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        contractRegistry,
        localNodeServer,
      }: {
        driver: Driver;
        contractRegistry: ContractAddressRegistry;
        localNodeServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, localNodeServer);
        await installSnapSimpleKeyring(driver);
        const snapSimpleKeyringPage = new SnapSimpleKeyringPage(driver);

        // Import snap account with private key on snap simple keyring page.
        await snapSimpleKeyringPage.importAccountWithPrivateKey(
          PRIVATE_KEY_TWO,
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_accountLabel('SSK Account');

        // Open Dapp with contract
        const testDapp = new TestDapp(driver);
        const contractAddress = await (
          contractRegistry as ContractAddressRegistry
        ).getContractAddress(smartContract);
        await testDapp.openTestDappPage({ contractAddress });
        await testDapp.check_pageIsLoaded();
        await testDapp.createDepositTransaction();

        // Confirm the transaction in activity list on MetaMask
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        const homePage = new HomePage(driver);
        await homePage.check_pageIsLoaded();
        await homePage.goToActivityList();
        const activityList = new ActivityListPage(driver);
        await activityList.check_confirmedTxNumberDisplayedInActivity();
        await activityList.check_txAmountInActivity('-4 ETH');
      },
    );
  });
});
