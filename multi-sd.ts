import './walletSetup';
import { Verifier } from './src/verifier';
import { Issuer } from './src/issuer';
import { Holder } from './src/holder';


(async () => {
  // Initiate actors
  const issuer = await Issuer.build();
  console.log('Issuer DID:', issuer.did.string());

  const holder = await Holder.build();
  console.log('Holder DID:', holder.did.string());

  const verifier = await Verifier.build();


  // Issue VC
  const credential = await issuer.issueVc(holder.did);
  console.log('Credential:', JSON.stringify(credential, null, 2));


  // Store credential by Holder
  await holder.storeCredential(credential);


  // Get proof request from verifier
  const proofRequest = verifier.getProofRequest(holder.did.string());
  console.log('Proof request:', JSON.stringify(proofRequest, null, 2));


  // Create proof
  const proofs = await holder.createProof(proofRequest);
  console.log('Proof result', JSON.stringify(proofs, null, 2));


  // verify proofs
  verifier.verify(proofs);
})().then(() => console.log('Done')).catch(console.error);
