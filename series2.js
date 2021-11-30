const StellarSdk = require('stellar-sdk');
const Crypto = require('crypto')
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const passphrase = StellarSdk.Networks.TESTNET;

const liveServer = new StellarSdk.Server('https://horizon.stellar.org/');
const livePassphrase = StellarSdk.Networks.PUBLIC;

const albedoSecretKey = process.env.albedo_sk
const albedoPublicKey = process.env.albedo_pk
const albedoKeyPair = StellarSdk.Keypair.fromSecret(albedoSecretKey)

const mySecretKey = process.env.stellar_test_sk;
const _mypPK = process.env.stellar_test_pk;
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

    const customAsset = new StellarSdk.Asset('s2q2', newPublicKey)
    const nativeAsset = new StellarSdk.Asset.native()
    //await addTomlLink(myAccount, myKeyPair)
    //await claimableBalance(myAccount, myKeyPair, newAccount, newKeyPair, nativeAsset, albedoAccount)
    await revokeSponsor(myAccount, myKeyPair, 'GDXHDCKLQ7WVMPTX5DPFQVJB5YJSIQYXGFVSTNRL4T43MI4NHYMQ6EUA')
    //SD7TV4QEC4X5XZG3NKSAXQISHXKLLVESX4H6KL7TBG36JLUYRBLBI7RC
    //await sponsorAccount(myAccount, myKeyPair)
    //await claimBalance(myAccount, myKeyPair)
    //await feeBumpPayment(myAccount, myKeyPair, newAccount, newKeyPair, nativeAsset)
    //await createAndIssueTrust(newAccount, newKeyPair, myAccount, myKeyPair, customAsset)
    //const memo = await Crypto.subtle.digest('SHA-256', new TextEncoder().encode('Stellar Quest Series 2'))
    //await createAccount(myKeyPair, newAccount, newKeyPair, '5000', 'e3366fcb087bdb2381b7069a19405b748da831c18145eba25654d1092e93ef37')


    //console.log(myAccount.account_id)

    //await createNewAccount(newKeypair);
    await getBalance(myKeyPair, myAccount)
    await getBalance(newKeyPair, newAccount)
    await getBalance(albedoKeyPair, albedoAccount)

})();

async function addTomlLink(account, keyPair) {
    const tx = new StellarSdk.TransactionBuilder(account,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.setOptions({
            homeDomain: 'lyxaaa.github.io/stelar-startup/'
        }))
        .setTimeout(30)
        .build()
    tx.sign(keyPair)
    await submitTransaction(tx)
}

async function revokeSponsor(sponsorAccount, sponsorKeyPair, childPublicKey) {
    const tx = new StellarSdk.TransactionBuilder(sponsorAccount,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.revokeAccountSponsorship({
            account: childPublicKey
        }))
        .setTimeout(30)
        .build()
    tx.sign(sponsorKeyPair)
    await submitTransaction(tx)
}

async function sponsorAccount(sponsorAccount, sponsorKeyPair) {
    const childKeyPair = StellarSdk.Keypair.random()
    const tx = new StellarSdk.TransactionBuilder(sponsorAccount,
        {fee: fee.toString(), networkPassphrase: passphrase})
        .addOperation(StellarSdk.Operation.beginSponsoringFutureReserves({
            sponsoredId: childKeyPair.publicKey()
        }))
        .addOperation(StellarSdk.Operation.createAccount({
            destination: childKeyPair.publicKey(),
            startingBalance: '0'
        }))
        .addOperation(StellarSdk.Operation.payment({
            asset: StellarSdk.Asset.native(),
            destination: childKeyPair.publicKey(),
            amount: '1'
        }))
        .addOperation(StellarSdk.Operation.endSponsoringFutureReserves({
            source: childKeyPair.publicKey()
        }))
        .setTimeout(30)
        .build()
    tx.sign(sponsorKeyPair)
    tx.sign(childKeyPair)
    console.log('PK:', childKeyPair.publicKey(), '\nSK:', childKeyPair.secret())
    await submitTransaction(tx)
}

async function claimBalance(claimAccount, claimKeyPair) {
    console.log('claimKeyPair.secret:', claimKeyPair.secret())
    const cb = await server.claimableBalances().claimant(claimKeyPair.publicKey()).call()
    let tx = new StellarSdk.TransactionBuilder(claimAccount,
        {fee: fee.toString(), networkPassphrase: passphrase});
    cb['records'].forEach(function (record) {
        tx.addOperation(StellarSdk.Operation.claimClaimableBalance({
            balanceId: record.id
        }))
    });
    tx = tx.setTimeout(30).build()
    tx.sign(claimKeyPair);
    //console.log(tx.setTimeout(30).build().toEnvelope().toXDR('base64'))
    await submitTransaction(tx)
}

async function claimableBalance(claimAccount, claimKeyPair, offerAccount, offerKeyPair, asset, albedoAccount) {
    const tx = new StellarSdk.TransactionBuilder(offerAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.createClaimableBalance({
            asset: asset,
            amount: '300',
            claimants: [
                new StellarSdk.Claimant(claimKeyPair.publicKey(),
                    StellarSdk.Claimant.predicateNot(
                        StellarSdk.Claimant.predicateBeforeAbsoluteTime(Math.ceil(Date.now() / 1000).toString()))),
            ]
        }))
        .setTimeout(30)
        .build();
    tx.sign(offerKeyPair);
    await submitTransaction(tx)
}

async function feeBumpPayment(sendAccount, sendKeyPair, recAccount, recKeyPair, asset) {
    const tx = new StellarSdk.TransactionBuilder(sendAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.payment({
            asset: asset,
            amount: '1',
            destination: recKeyPair.publicKey()
        }))
        .setTimeout(30)
        .build();
    tx.sign(sendKeyPair);

    const fb = new StellarSdk.TransactionBuilder
        .buildFeeBumpTransaction(recKeyPair, fee, tx, passphrase)
    fb.sign(recKeyPair);
    await submitTransaction(fb);
}

async function createAndIssueTrust(sendAccount, sendKeyPair, recAccount, recKeyPair, asset) {
    const tx = new StellarSdk.TransactionBuilder(recAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: '10'
        }))
        .addOperation(StellarSdk.Operation.payment({
            asset: asset,
            amount: '1',
            source: sendKeyPair.publicKey(),
            destination: recKeyPair.publicKey()
        }))
        .setTimeout(30)
        .build();
    tx.sign(sendKeyPair);
    tx.sign(recKeyPair);
    await submitTransaction(tx);
}

async function createAccount(newKeyPair, fundAccount, fundKeyPair, startingBalance, memo) {
    const tx = new StellarSdk.TransactionBuilder(fundAccount,
        { fee: fee.toString(), networkPassphrase : passphrase})
        .addOperation(StellarSdk.Operation.createAccount({
            destination: newKeyPair.publicKey(),
            startingBalance: startingBalance
        }))
        .addMemo(StellarSdk.Memo.hash(memo))
        .setTimeout(30)
        .build();
    tx.sign(fundKeyPair);
    await submitTransaction(tx);
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