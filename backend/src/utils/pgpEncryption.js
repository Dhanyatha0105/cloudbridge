const forge = require('node-forge');

// PGP-style encryption using RSA-OAEP + AES-256-GCM for hybrid encryption
// Addresses "silent data sprawl" — all cross-system payloads are encrypted at rest and in transit

let keypair = null;

const generateKeypair = () => {
  keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  return {
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
  };
};

const encryptPayload = (data, publicKeyPem) => {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const aesKey = forge.random.getBytesSync(32);
  const iv = forge.random.getBytesSync(12);

  const cipher = forge.cipher.createCipher('AES-GCM', aesKey);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(JSON.stringify(data)));
  cipher.finish();

  const encryptedData = cipher.output.getBytes();
  const tag = cipher.mode.tag.getBytes();
  const encryptedKey = publicKey.encrypt(aesKey, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
  });

  return {
    encryptedKey: forge.util.encode64(encryptedKey),
    iv: forge.util.encode64(iv),
    tag: forge.util.encode64(tag),
    data: forge.util.encode64(encryptedData),
  };
};

const decryptPayload = (envelope, privateKeyPem) => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const aesKey = privateKey.decrypt(
    forge.util.decode64(envelope.encryptedKey),
    'RSA-OAEP',
    { md: forge.md.sha256.create() }
  );

  const decipher = forge.cipher.createDecipher('AES-GCM', aesKey);
  decipher.start({
    iv: forge.util.decode64(envelope.iv),
    tag: forge.util.createBuffer(forge.util.decode64(envelope.tag)),
  });
  decipher.update(forge.util.createBuffer(forge.util.decode64(envelope.data)));
  const pass = decipher.finish();

  if (!pass) throw new Error('Decryption authentication failed — payload may be tampered');
  return JSON.parse(decipher.output.toString());
};

module.exports = { generateKeypair, encryptPayload, decryptPayload };
