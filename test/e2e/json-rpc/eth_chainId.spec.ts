import { strict as assert } from 'assert';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import { Driver } from '../webdriver/driver';
import { Ganache } from '../localNode/ganache';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';

describe('eth_chainId', function () {
  it('returns the chain ID of the current network', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        localNodeOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        localNodeServer,
      }: {
        driver: Driver;
        localNodeServer?: Ganache;
      }) => {
        await loginWithBalanceValidation(driver, localNodeServer);

        // eth_chainId
        await driver.openNewPage(`http://127.0.0.1:8080`);
        const request: string = JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 0,
        });
        const result = (await driver.executeScript(
          `return window.ethereum.request(${request})`,
        )) as string;

        assert.equal(result, '0x539');
      },
    );
  });
});
