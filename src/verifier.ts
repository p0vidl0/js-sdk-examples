import { AuthorizationRequestMessage, CircuitId, ProofService } from '@0xpolygonid/js-sdk';
import { buildCircuitStorage, buildProofService, defaultNetworkConnection } from './helpers';
import { initInMemoryDataStorageAndWallets } from '../walletSetup';
import { randomUUID } from 'node:crypto';

export class Verifier {
  private readonly circuitId = CircuitId.AtomicQuerySigV2;

  private constructor(private readonly proofService: ProofService) {}

  getProofRequest(did: string) {
    const sessionId = randomUUID();
    const requestId = randomUUID();

    return {
      'body': {
        'callbackUrl': `https://verifier.com/callback?sessionID=${sessionId}`,
        'reason': 'for testing purposes',
        'scope': [
          {
            'circuitId': this.circuitId,
            'id': 1732853372,
            'query': {
              'allowedIssuers': [
                '*',
              ],
              'context': 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
              'credentialSubject': {
                'birthday': {
                  '$lt': 20061129, // not younger than 18 years old
                },
              },
              'type': 'KYCAgeCredential',
            },
          },
          {
            'circuitId': this.circuitId,
            'id': 1732853372,
            'query': {
              'allowedIssuers': [
                '*',
              ],
              'context': 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
              'credentialSubject': {
                'birthday': {
                  '$gt': 19961129, // not older than 28 years old
                },
              },
              'type': 'KYCAgeCredential',
            },
          },
          {
            'circuitId': this.circuitId,
            'id': 1732853372,
            'query': {
              'allowedIssuers': [
                '*',
              ],
              'context': 'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld',
              'credentialSubject': {
                'documentType': {}, // disclose the document type value
              },
              'type': 'KYCAgeCredential',
            },
          },
        ],
      },
      'from': 'did:iden3:polygon:amoy:xCkXubP2T1zsUQpFLwczwfbWpdBYBxmJDtUTWAUCE',
      to: did,
      'id': requestId,
      'thid': requestId,
      'typ': 'application/iden3comm-plain-json',
      'type': 'https://iden3-communication.io/authorization/1.0/request',
    } as AuthorizationRequestMessage;
  }

  async verify(authResult: any) {
    for (let i = 0; i < authResult.authResponse.body.scope.length; i += 1) {
      const proof = authResult.authResponse.body.scope[i];
      const result = await this.proofService.verifyProof(proof, this.circuitId);
      console.log(`Query ${i + 1} proof verification result:`, result);
    }
  }

  static async build() {
    const circuitStorage = await buildCircuitStorage();
    const {
      identityWallet,
      credentialWallet,
      dataStorage,
    } = await initInMemoryDataStorageAndWallets(defaultNetworkConnection);
    const proofService = await buildProofService(identityWallet, credentialWallet, dataStorage.states, circuitStorage);

    return new Verifier(proofService);
  }
}

