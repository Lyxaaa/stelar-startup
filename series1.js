//const fetch = require("node-fetch");
//import fetch from "node-fetch";
//import StellarSdk from "stellar-sdk";
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const passphrase = StellarSdk.Networks.TESTNET;

const mySecretKey = process.env.stellar_test_sk;
const myKeypair = StellarSdk.Keypair.fromSecret(mySecretKey);
const myPublicKey = myKeypair.publicKey();
const _pk = process.env.stellar_test_pk;

const newSecretKey = process.env.stellar_test_sk_2;
const gotPublic = process.env.stellar_test_pk_2;
const newKeypair = StellarSdk.Keypair.fromSecret(newSecretKey);
const newPublicKey = newKeypair.publicKey();
var fee
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function main() {
    fee = await server.fetchBaseFee();

    const newAccount = await server.loadAccount(newPublicKey);

    //await createNewAccount(myKeypair, newAccount, newPublicKey, newSecretKey)

    const myAccount = await server.loadAccount(myPublicKey);

    //console.log(myAccount.account_id)

    //await createNewAccount(newKeypair);
    await getBalance(myKeypair, myAccount)
    await getBalance(newKeypair, newAccount)
    console.log('Account id:', myAccount.accountId())

    const asset = new StellarSdk.Asset('qst5', newPublicKey)
    const nativeAsset = new StellarSdk.Asset.native()
    const issuingAccount = 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B';
    const SRTAsset = new StellarSdk.Asset('SRT', issuingAccount)
    const pathXLMAsset = new StellarSdk.Asset(nativeAsset.code, issuingAccount)
    await changeTrust(myAccount, myKeypair,
        new StellarSdk.Asset('lyxres2', 'GBXOPVNWXBQN6BGDSPBWLITB3UJ26GFPONUKYK357NNRZBV3ZJNHKLNN'),
        '1')
    //await buyOffer(myAccount, myKeypair)
    //await pathPayment(newAccount, newKeypair, nativeAsset, '1', myPublicKey, SRTAsset, '1', [pathXLMAsset])
    //await channelPayment(myAccount, myKeypair, asset, '1', newPublicKey, newAccount, newKeypair)
    //await sellOffer(myAccount, myKeypair, asset, nativeAsset, '1', 5)
    //await changeTrust(myAccount, myKeypair, newPublicKey, asset, '15')
    //await createAndSendAsset(newAccount, newKeypair, myPublicKey, asset, '1')
    //await addData(myAccount, myKeypair, 'Hello', 'World')
    //await addMultiSig(myAccount, myKeypair)
    //await multiSigTransaction(myAccount, newKeypair, newPublicKey)
    //await multiSigTransaction(myAccount, newKeypair, newPublicKey)
    //mergeTransaction(myAccount, myKeypair, newPublicKey);
    //createNewAccount(myKeypair)
    //await pay(myAccount, myKeypair, newPublicKey, '10')

    //await sleep(8000)
    //await getBalance(myKeypair, myAccount)
    //await getBalance(newKeypair, newAccount)
})();

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

async function genericTransaction(fromAccount) {
    return new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
}

async function pathPayment(fromAccount, signingKeyPair,
                           assetSent, amountSent, toPublicKey,
                           assetRec, amountRec, path) {
    const transaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.pathPaymentStrictSend({
            sendAsset: assetSent,
            sendAmount: amountSent,
            destAsset: assetRec,
            destMin: amountRec,
            destination: toPublicKey,
            path: path
        }))
        .setTimeout(30)
        .build();
    transaction.sign(signingKeyPair);
    await submitTransaction(transaction);
}

async function channelPayment(fromAccount, signingKeyPair, asset, amount, toPublicKey, feeAccount, feeKeyPair) {
    const transaction = new StellarSdk.TransactionBuilder(feeAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.payment({
            source: signingKeyPair.publicKey(),
            destination: toPublicKey,
            asset: asset,
            amount: amount
        }))
        .setTimeout(30)
        .build();
    transaction.sign(signingKeyPair);
    transaction.sign(feeKeyPair)
    await submitTransaction(transaction);
}

async function buyOffer(account, signingKeyPair) {
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.manageBuyOffer({
            selling: StellarSdk.Asset.native(),
            buying: new StellarSdk.Asset('lyxres2', 'GDYUXSTK62LJHUCML7ECEBNRDH7OOLZXTPXMAQBIGWDQO5FHN4NNQGPN'),
            buyAmount: '0.2',
            price: 30
        }))
        .setTimeout(30)
        .build()
    tx.sign(signingKeyPair)
    await submitTransaction(tx)
}

async function sellOffer(fromAccount, signingKeyPair, sellAsset, buyAsset, amount, price) {
    const transaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.manageSellOffer({
            selling: sellAsset,
            buying: buyAsset,
            amount: amount,
            price: price
        }))
        .setTimeout(30)
        .build();
    transaction.sign(signingKeyPair);
    await submitTransaction(transaction);
}

async function changeTrust(fromAccount, signingKeyPair, asset, limit) {
    const transaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: limit
        }))
        .setTimeout(30)
        .build();
    transaction.sign(signingKeyPair);
    await submitTransaction(transaction);
}

async function createAndSendAsset(fromAccount, signingKeyPair, toPublicKey, asset, amount) {
    //await addData(fromAccount, signingKeyPair, 'qst5', '2')
    await pay(fromAccount, signingKeyPair, toPublicKey, asset, amount)
}

async function multiSigTransaction(fromAccount, signingKeyPair, toPublicKey) {
    const paymentTransaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.payment({
            amount: '35',
            asset: StellarSdk.Asset.native(),
            destination: toPublicKey
        }))
        .setTimeout(30)
        .build();
    paymentTransaction.sign(signingKeyPair);
    await submitTransaction(paymentTransaction);
}

async function addMultiSig(fromAccount, signingKeyPair) {
    const dataTransaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {ed25519PublicKey: newPublicKey, weight: 1}
        }))
        .setTimeout(30)
        .build();
    dataTransaction.sign(signingKeyPair);
    await submitTransaction(dataTransaction);
}

async function addData(fromAccount, signingKeyPair, dataName, dataValue) {
    const dataTransaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.manageData({
            name: dataName,
            value: dataValue
        }))
        .setTimeout(30)
        .build();
    dataTransaction.sign(signingKeyPair);
    await submitTransaction(dataTransaction);
}

async function pay(fromAccount, signingKeyPair, toPublicKey, asset, amount) {
    const paymentTransaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.payment({
            amount: amount,
            asset: asset, //StellarSdk.Asset.native(),
            destination: toPublicKey
        }))
        .setTimeout(30)
        .build();
    paymentTransaction.sign(signingKeyPair);
    await submitTransaction(paymentTransaction);
}

async function mergeTransaction(fromAccount, signingKeyPair, toPublicKey) {
    const mergeTransaction = new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase: passphrase })
        .addOperation(StellarSdk.Operation.accountMerge({
            destination: toPublicKey,
            source: signingKeyPair.publicKey()
        }))
        .setTimeout(30)
        .build()

    mergeTransaction.sign(signingKeyPair)
    await submitTransaction(mergeTransaction)
}

async function generateKeyPair() {
    const pair = StellarSdk.Keypair.random()
    console.log('Keypair:',pair.secret(), pair.publicKey())
    return pair
}

async function createNewAccount(createPair, existingAccount, existingPublicKey, existingSecretKey) {
    server.accounts()
        .accountId(existingPublicKey)
        .call()
        .then(({ sequence }) => {
            const transaction = new StellarSdk.TransactionBuilder(existingAccount, {
                fee: fee,
                networkPassphrase: passphrase
            })
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: createPair.publicKey(),
                    startingBalance: '1000'
                }))
                .setTimeout(30)
                .build()
            transaction.sign(StellarSdk.Keypair.fromSecret(existingSecretKey))
            return server.submitTransaction(transaction)
        })
        .then(results => {
            console.log('Transaction', results._links.transaction.href)
            console.log('New Keypair', createPair.publicKey(), createPair.secret())
        })
}

async function getBalance(keyPair, account) {
    console.log("Balances for account: " + keyPair.publicKey());
    account.balances.forEach(function (balance) {
        console.log("Type:", balance.asset_type, ", Balance:", balance.balance);
    });
}