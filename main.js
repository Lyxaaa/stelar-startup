var StellarSdk = require('stellar-sdk');
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const sourceSecretKey = 'SBWN6TQ2B72IDBKM6QIRUAXLPMXGGVLPRI6IK3ODC7DOSMBPABULQF3Y';
const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
const sourcePublicKey = sourceKeypair.publicKey();
(async function main() {
    const account = await server.loadAccount(sourcePublicKey);
    const fee = await server.fetchBaseFee();

    const mergeTransaction = new StellarSdk.TransactionBuilder(account, { fee })
        .addOperation(StellarSdk.Operation.accountMerge({
            destination: sourcePublicKey
        }))
        .setTimeout(30)
        .build()

    mergeTransaction.sign(sourceKeypair)
    console.log(mergeTransaction.toEnvelope().toXDR('base64'))
    try {
        const mergeTransactionResult = await server.submitTransaction(mergeTransaction);
        console.log(JSON.stringify(mergeTransactionResult, null, 2));
        console.log('\nSuccess, view transaction');
    } catch (e) {
        console.log('An error has occurred', e)
    }

    console.log('Hello');

    server.operations()
        .forAccount(sourceSecretKey)
        .call().then(function (r) {
        console.log(r)
    });
})()
