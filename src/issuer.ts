import { initInMemoryDataStorageAndWallets } from '../walletSetup';
import {
  createKYCAgeCredential,
  defaultIdentityCreationOptions,
  defaultNetworkConnection,
} from './helpers';
import { core, IIdentityWallet } from '@0xpolygonid/js-sdk';

export class Issuer {
  private constructor(
    readonly did: core.DID,
    private identityWallet: IIdentityWallet,
  ) {}

  async issueVc(did: core.DID) {
    const credentialRequest = createKYCAgeCredential(did);
    return this.identityWallet.issueCredential(this.did, credentialRequest);
  }

  static async build() {
    const { identityWallet } = await initInMemoryDataStorageAndWallets(defaultNetworkConnection);
    const { did } = await identityWallet.createIdentity({
      ...defaultIdentityCreationOptions,
    });

    return new Issuer(did, identityWallet);
  }
}
