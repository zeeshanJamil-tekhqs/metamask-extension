import log from 'loglevel';
import getFetchWithTimeout from '../../../../shared/modules/fetch-with-timeout';
import {
  type IntermediaryStateType,
  BaseStore,
  MetaMaskStorageStructure,
} from './BaseStore';

const fetchWithTimeout = getFetchWithTimeout();

const FIXTURE_SERVER_HOST = 'localhost';
const FIXTURE_SERVER_PORT = 12345;
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${FIXTURE_SERVER_PORT}/state.json`;

/**
 * A read-only network-based storage wrapper
 */
export default class ReadOnlyNetworkStore extends BaseStore {
  #initialized: boolean;

  #initializing?: Promise<void>;

  #state: IntermediaryStateType | null;

  constructor() {
    super();
    this.#initialized = false;
    this.#initializing = this.#init();
    this.#state = null;
  }

  /**
   * Declares this store as compatible with the current browser
   */
  isSupported = true;

  /**
   * Initializes by loading state from the network
   */
  async #init() {
    try {
      const response = await fetchWithTimeout(FIXTURE_SERVER_URL);

      if (response.ok) {
        this.#state = await response.json();
      } else {
        log.debug(
          `Received response with a status of ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      console.log('error', error);
      if (error instanceof Error) {
        log.debug(`Error loading network state: '${error.message}'`);
      } else {
        log.debug(`Error loading network state: An unknown error occurred`);
      }
    } finally {
      this.#initialized = true;
    }
  }

  /**
   * Returns state
   */
  async get() {
    if (!this.#initialized) {
      await this.#initializing;
    }
    return this.#state;
  }

  /**
   * Sets the key in local state
   *
   * @param obj - The data to set
   * @param obj.data - The MetaMask State tree
   * @param obj.meta - The metadata object
   * @param obj.meta.version - The version of the state tree determined by the
   * migration
   */
  async set(obj: MetaMaskStorageStructure): Promise<void> {
    if (!obj) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.#initialized) {
      await this.#initializing;
    }
    this.#state = obj;
  }
}
