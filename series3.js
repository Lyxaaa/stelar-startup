const StellarSdk = require('stellar-sdk');
const Crypto = require('crypto')
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const passphrase = StellarSdk.Networks.TESTNET;

const liveServer = new StellarSdk.Server('https://horizon.stellar.org/');
const livePassphrase = StellarSdk.Networks.PUBLIC;

const albedoSecretKey = process.env.albedo_sk
const albedoPublicKey = process.env.albedo_pk
const albedoKeyPair = StellarSdk.Keypair.fromSecret(albedoSecretKey)

const mySecretKey = process.env.stellar_test_sk_s3q2;
const _mypPK = process.env.stellar_test_pk_s3q2;
const myKeyPair = StellarSdk.Keypair.fromSecret(mySecretKey);
const myPublicKey = myKeyPair.publicKey();

const newSecretKey = process.env.stellar_test_sk_2;
const _newPK = process.env.stellar_test_pk_2;
const newKeyPair = StellarSdk.Keypair.fromSecret(newSecretKey);
const newPublicKey = newKeyPair.publicKey();
var fee

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function main() {
    fee = await server.fetchBaseFee();
    const newAccount = await server.loadAccount(newPublicKey);
    const myAccount = await server.loadAccount(myPublicKey);
    const albedoAccount = await liveServer.loadAccount(albedoPublicKey);

    const s3q4Acc = await server.loadAccount('GAI6JOELVOG56PHAF7D6EDHLVWX5CIYBMGGZUXKJFRRIAXCN5B7CSYB5')
    const s3q5Acc = await server.loadAccount('GAG3CDBO7XVECHGJKAOK6IAYDRXWV2C4R6TAZU2V2VSGESPKPOZXOT4V')
    const s3q5KeyPair = StellarSdk.Keypair.fromSecret('SA4JZL2GDT5PMS3764ETA6K5Z52AS2OUZ6HQKGC5PQNPQXSS2JVSXALW')
    const s3q5Asset = new StellarSdk.Asset('SQ0402', 'GA7PT6IPFVC4FGG273ZHGCNGG2O52F3B6CLVSI4SNIYOXLUNIOSFCK4F')
    const nativeAsset = new StellarSdk.Asset.native()
    await createTrustAndPayAndClawback(s3q5Acc, s3q5KeyPair, newAccount, newKeyPair, s3q5Asset)
    // await addTxSigner(myAccount, myKeyPair, s3q4Acc.accountId())
    // const kanayeNetKeyPair = new StellarSdk.Keypair({type: StellarSdk.Keypair, publicKey: 'KanayeNet', secretKey: 'b42f743feaa0ecff7c9fb32c548ed56de849858b4eb5d17a64d6a90c89f60e5f'})
    // await floodTx(myAccount, myKeyPair, newKeyPair)
    // await bumpSeqNum(myAccount, myKeyPair)
    // await addTomlLink(myAccount, myKeyPair)
    // await getBalance(myKeyPair, myAccount)
    // await getBalance(newKeyPair, newAccount)
    // await getBalance(albedoKeyPair, albedoAccount)

})();

async function createTrustAndPayAndClawback(sendAccount, sendKeyPair, recAccount, recKeyPair, asset) {
    const tx = new StellarSdk.TransactionBuilder(sendAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        // .addOperation(StellarSdk.Operation.setOptions({
        //     setFlags: StellarSdk.AuthRevocableFlag
        // }))
        // .addOperation(StellarSdk.Operation.setOptions({
        //     setFlags: StellarSdk.AuthClawbackEnabledFlag
        //     //source: recKeyPair.publicKey()
        // }))
        .addOperation(StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: '10',
            source: recKeyPair.publicKey()
        }))
        .addOperation(StellarSdk.Operation.payment({
            asset: asset,
            amount: '1',
            destination: recKeyPair.publicKey()
        }))
        .addOperation(StellarSdk.Operation.clawback({
            asset: asset,
            amount: '1',
            from: recKeyPair.publicKey()
        }))
        .setTimeout(30)
        .build();
    tx.sign(sendKeyPair);
    tx.sign(recKeyPair);
    await submitTransaction(tx);
}


async function addTxSigner(account, keyPair, payKey) {
    account.incrementSequenceNumber()
    const preTx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.payment({
            destination: payKey,
            asset: StellarSdk.Asset.native(),
            amount: '15'
            }
        ))
        .setTimeout(30)
        .build()
    account = await server.loadAccount(keyPair.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {preAuthTx: preTx.hash(), weight: 1}
        }))
        .setTimeout(30)
        .build()
    tx.sign(keyPair)
    await submitTransaction(tx)

    // const newTx = new StellarSdk.TransactionBuilder(account,
    //     {fee: fee.toString(), networkPassphrase: passphrase})
    //     .addOperation(StellarSdk.Operation.payment({
    //             destination: payKey,
    //             asset: StellarSdk.Asset.native(),
    //             amount: '15'
    //         }
    //     ))
    //     .setTimeout(30)
    //     .build()
    await submitTransaction(preTx)
}

async function selfRemoveSigner(account, signerKeyPair) {
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {sha256Hash: signerKeyPair, weight: 0}
        }))
        .setTimeout(30)
        .build()
    tx.sign(signerKeyPair)
    await submitTransaction(tx)
}

async function addSigner(account, keyPair, newSigner) {
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {sha256Hash: newSigner, weight: 1}
        }))
        .setTimeout(30)
        .build()
    tx.sign(keyPair)
    await submitTransaction(tx)
}

async function floodTx(account, keyPair, childKeyPair) {
    let tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
    for (let i = 0; i < 50; i++) {
        tx.addOperation(StellarSdk.Operation.beginSponsoringFutureReserves({
            sponsoredId: childKeyPair.publicKey()
        }))
        .addOperation(StellarSdk.Operation.endSponsoringFutureReserves({
                source: childKeyPair.publicKey()
        }))
    }
    tx = tx.setTimeout(30).build()
    tx.sign(keyPair)
    tx.sign(childKeyPair)
    await submitTransaction(tx)
}

async function bumpSeqNum(account, keyPair) {
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.bumpSequence({
            bumpTo: '110101115104111'
        }))
        .setTimeout(30)
        .build()
    tx.sign(keyPair)
    await submitTransaction(tx)
}

async function getBalance(keyPair, account) {
    console.log("Balances for account: " + keyPair.publicKey());
    account.balances.forEach(function (balance) {
        console.log("Type:", balance.asset_type, "Code:", balance.asset_code, ", Balance:", balance.balance);
    });
}

async function submitTransaction(transaction) {
    console.log(transaction.toEnvelope().toXDR('base64'))
    try {
        const transactionResult = await server.submitTransaction(transaction);
        console.log(JSON.stringify(transactionResult, null, 2));
        console.log('\nSuccess, view transaction');
    } catch (e) {
        console.log('An error has occurred', e['response']['data']['extras'])
    }
}