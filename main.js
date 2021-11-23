//const fetch = require("node-fetch");
//import fetch from "node-fetch";
//import StellarSdk from "stellar-sdk";
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const passphrase = StellarSdk.Networks.TESTNET;

const mySecretKey = 'SBWN6TQ2B72IDBKM6QIRUAXLPMXGGVLPRI6IK3ODC7DOSMBPABULQF3Y';
const myKeypair = StellarSdk.Keypair.fromSecret(mySecretKey);
const myPublicKey = myKeypair.publicKey();
const _pk = 'GBS5UM66NTMGVTOBEYHHFTYIM2KF457DXOYQ4IHIZ2ZOJHSI7DRLPMRL';

const newSecretKey = 'SBBJVHCZO7BPPUTZRY5N2BTCUIG67L5GUX77R7WB4UMXZY752CEOLZ4U';
const gotPublic = 'GBUOK64Y2EO2P3ZFC5P77UCK3OBSTJLM4H7QIB5EUJRLZAWDT7WGYVZC';
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
    const XLMAsset = new StellarSdk.Asset.native()
    await channelPayment(myAccount, myKeypair, asset, '1', newPublicKey, newAccount, newKeypair)
    //await sellOffer(myAccount, myKeypair, asset, XLMAsset, '1', 5)
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
        console.log('An error has occurred', e)
    }
}

async function genericTransaction(fromAccount) {
    return new StellarSdk.TransactionBuilder(fromAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
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

async function changeTrust(fromAccount, signingKeyPair, toPublicKey, asset, limit) {
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