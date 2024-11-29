import { initInMemoryDataStorageAndWallets } from '../walletSetup';
import {
  buildCircuitStorage, buildProofService,
  defaultIdentityCreationOptions,
  defaultNetworkConnection, formatCredentials, getAuthHandler,
} from './helpers';
import {
  AuthorizationRequestMessage,
  core,
  CredentialWallet,
  ICircuitStorage,
  ProofService,
  W3CCredential,
} from '@0xpolygonid/js-sdk';

export class Holder {
  private constructor(
    readonly did: core.DID,
    private readonly credentialWallet: CredentialWallet,
    private readonly proofService: ProofService,
    private readonly circuitStorage: ICircuitStorage,
  ) {}


  async storeCredential(credential: W3CCredential) {
    await this.credentialWallet.saveAll([credential]);
  }

  async createProof(proofRequest: AuthorizationRequestMessage) {
    // Holder user confirms the proof request
    console.log(
      `This counterparty requests a proof for ${proofRequest.body.reason}; Credentials: ${JSON.stringify(
        formatCredentials(proofRequest),
        null,
        2,
      )}\n [Continue] or [Cancel]`,
    );

    const authHandler = await getAuthHandler(this.proofService, this.circuitStorage);
    const packed = Buffer.from(JSON.stringify(proofRequest), 'utf-8');

    return authHandler.handleAuthorizationRequest(
      this.did,
      packed,
    );
  }

  static async build() {
    const {
      identityWallet,
      dataStorage,
      credentialWallet,
    } = await initInMemoryDataStorageAndWallets(defaultNetworkConnection);
    const { did } = await identityWallet.createIdentity({
      ...defaultIdentityCreationOptions,
    });
    const circuitStorage = await buildCircuitStorage();
    const proofService = await buildProofService(identityWallet, credentialWallet, dataStorage.states, circuitStorage);

    return new Holder(did, credentialWallet, proofService, circuitStorage);
  }
}
