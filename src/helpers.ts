import {
  AuthDataPrepareFunc,
  AuthHandler,
  AuthorizationRequestMessage,
  CircuitData,
  CircuitId,
  core,
  CredentialRequest,
  CredentialStatusType,
  DataPrepareHandlerFunc,
  FSCircuitStorage,
  ICircuitStorage,
  IdentityCreationOptions,
  IPackageManager,
  PackageManager,
  PlainPacker,
  ProvingParams,
  VerificationHandlerFunc,
  VerificationParams,
  ZKPPacker,
  StateVerificationFunc,
  IIdentityWallet,
  ICredentialWallet,
  IStateStorage,
  ProofService,
} from '@0xpolygonid/js-sdk';
import path from 'node:path';
import { proving } from '@iden3/js-jwz';

export const rhsUrl = process.env.RHS_URL as string;

export const defaultNetworkConnection = {
  rpcUrl: process.env.RPC_URL as string,
  contractAddress: process.env.CONTRACT_ADDRESS as string,
};


export const defaultIdentityCreationOptions: IdentityCreationOptions = {
  method: core.DidMethod.PolygonId,
  blockchain: core.Blockchain.Polygon,
  networkId: core.NetworkId.Amoy,
  revocationOpts: {
    type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
    id: rhsUrl,
  },
};

export function createKYCAgeCredential(did: core.DID) {
  const credentialRequest: CredentialRequest = {
    credentialSchema:
      'https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json/KYCAgeCredential-v3.json',
    type: 'KYCAgeCredential',
    credentialSubject: {
      id: did.string(),
      birthday: 19961224,
      documentType: 99,
    },
    expiration: 12345678888,
    revocationOpts: {
      type: CredentialStatusType.Iden3ReverseSparseMerkleTreeProof,
      id: rhsUrl,
    },
  };
  return credentialRequest;
}

export const formatCredentials = (message: AuthorizationRequestMessage) => {
  return message.body.scope.map(({ circuitId, query }) => {
    const typedQuery = query as {
      type: string;
      credentialSubject: { [field: string]: { [operator: string]: string } };
      allowedIssuers: string[];
    };
    const data: { name: string; value: string }[] = [];
    data.push({
      name: 'Credential type',
      value: typedQuery.type,
    });
    if (typedQuery.credentialSubject) {
      data.push({
        name: 'Requirements',
        value: Object.keys(typedQuery.credentialSubject).reduce(
          (acc, field) => {
            const filter = typedQuery.credentialSubject[field] as any;
            const filterStr = Object.keys(filter).map(
              (operator) => `${field} - ${operator} ${filter[operator]}`,
            );
            return acc.concat(JSON.stringify(filterStr));
          },
          '',
        ),
      });
    }
    data.push({
      name: 'Allowed issuers',
      value: typedQuery.allowedIssuers.join(', '),
    });
    data.push({
      name: 'Proof type',
      value: circuitId,
    });
    return data;
  });
};

export const buildCircuitStorage = async (): Promise<ICircuitStorage> => {
  const folder = (process.env.CIRCUITS_PATH as string) || '../circuits';
  const dirname = path.join(__dirname, folder);

  return new FSCircuitStorage({ dirname });
};

export const initPackageManager = async (
  circuitData: CircuitData,
  prepareFn: AuthDataPrepareFunc,
  stateVerificationFn: StateVerificationFunc,
): Promise<IPackageManager> => {
  const authInputsHandler = new DataPrepareHandlerFunc(prepareFn);

  const verificationFn = new VerificationHandlerFunc(stateVerificationFn);
  const mapKey =
    proving.provingMethodGroth16AuthV2Instance.methodAlg.toString();
  const verificationParamMap: Map<string, VerificationParams> = new Map([
    [mapKey, { key: circuitData.verificationKey!, verificationFn }],
  ]);

  const provingParamMap: Map<string, ProvingParams> = new Map();
  provingParamMap.set(mapKey, {
    dataPreparer: authInputsHandler,
    provingKey: circuitData.provingKey!,
    wasm: circuitData.wasm!,
  });

  const mgr: IPackageManager = new PackageManager();
  const packer = new ZKPPacker(provingParamMap, verificationParamMap);
  const plainPacker = new PlainPacker();
  mgr.registerPackers([packer, plainPacker]);

  return mgr;
};

export const buildProofService = async (
  identityWallet: IIdentityWallet,
  credentialWallet: ICredentialWallet,
  stateStorage: IStateStorage,
  circuitStorage: ICircuitStorage,
): Promise<ProofService> => {
  return new ProofService(
    identityWallet,
    credentialWallet,
    circuitStorage,
    stateStorage,
    {
      ipfsGatewayURL: 'https://ipfs.io',
    },
  );
};


export const getAuthHandler = async (proofService: ProofService, circuitStorage: ICircuitStorage) => {
  const circuitId = CircuitId.AuthV2;
  const authV2Data = await circuitStorage.loadCircuitData(circuitId);
  const packageManager = await initPackageManager(
    authV2Data,
    proofService.generateAuthV2Inputs.bind(proofService),
    proofService.verifyState.bind(proofService),
  );
  return new AuthHandler(packageManager, proofService);
};
