//Install
async function installPLSHTL(days,pls_receiver_address) {

	if(! await connectionOK()){return false;}
	
	let HTLContract = new web3.eth.Contract(HTLContractABI);
	HTLContract.handleRevert = true;

	let contractDeployer = HTLContract.deploy({
		data: '0x' + getInstallByteCode(days),
		arguments: [pls_receiver_address],
	});

	let gas = await contractDeployer.estimateGas({
		from: connected_evm_account,
	});
	let gasPrice = await web3.eth.getGasPrice();
	let totalCostInETH = web3.utils.fromWei(gas * gasPrice, 'ether');
	let result = await confirmModal("Storage cost: " + totalCostInETH + " , continue?");
	
	
	if (result) {
		darken_layer.classList.remove("hidden");
		let error_message = "";
		let tx_hash ="";
		let confirmed =false;
		//create contract deployer
		const deployer = HTLContract.deploy({
		data: '0x' + getInstallByteCode(days), //bytecode must start with 0x
			arguments: [pls_receiver_address], //receiver_address for the constructor in the contract
		});

		//send transaction to the network
		await deployer.send({
  			from: connected_evm_account
		}, function(error, transactionHash){})
		.on('error', function(error){
			error_message = error.message;
			messages.innerHTML = error.message;
		})
		.on('transactionHash', function(transactionHash){tx_hash=transactionHash})
		.on('receipt', function(receipt){})
		.on('confirmation', function(confirmationNumber, receipt){confirmed=true})
		.then(tx => {})
		.catch(error => {
			error_message = error.message;
			messages.innerHTML = error_message;
		});
		if(tx_hash != "" && confirmed){
			return tx_hash;
		}
		if(error_message != ''){
			alertModal("Reject any pending transactions in the wallet and try to install again. Error: "+error_message)
		}
		return false;

	}
	return false;
}	


//Fund htl scid. Used for both stages.
async function fundPLSHTL(id,pls_htl_scid,pls_amt,hash){
	if(! await connectionOK()){return false;}
	let HTLContract = new web3.eth.Contract(HTLContractABI, pls_htl_scid);
	//send transaction to the network
	const txReceipt = await HTLContract.methods
    .startSwap("0x"+hash) //name of the function you are calling in the contract
    .send({ from: connected_evm_account, value: toPLSAtomicUnits(pls_amt)})
	.catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
			return false;
		}
	});
	if(typeof txReceipt.transactionHash !== 'undefined'){
		//show tx hash
		alertModal("Funds Deposited and locked with provided hash." + "<br> TXID" + txReceipt.transactionHash);
		return txReceipt.transactionHash;
	}
	return false;	
}

//Withdraw PLS
async function plsWithdrawal(key,pls_txid="",pls_scid="") {
	if(! await connectionOK()){return false;}
	if(key == ""){
		await alertModal("key is null");
	}
	if(pls_txid != ""){
		pls_scid = await getContractAddressFromTxId(pls_txid);		
	}
	let HTLContract = new web3.eth.Contract(HTLContractABI, pls_scid);
	//send transaction to the network
	const txReceipt = await HTLContract.methods
    .withdraw(key) //name of the function you are calling in the contract
    .send({ from: connected_evm_account })
	.catch(async (err) => {
		if(typeof err.message !== 'undefined'){
			await alertModal(err.message);			
			return "";
		}
	});

	if(typeof txReceipt.transactionHash !== 'undefined'){
		//show tx hash
		await alertModal(txReceipt.transactionHash);
		return txReceipt.transactionHash;
	}
}


//Withdraw PLS
async function refundPLS(pls_txid="",pls_scid="") {
	if(! await connectionOK()){return false;}
	if(pls_txid != ""){
		pls_scid = await getContractAddressFromTxId(pls_txid);
	}
	let HTLContract = new web3.eth.Contract(HTLContractABI, pls_scid);
	//send transaction to the network
	const txReceipt = await HTLContract.methods
    .refund() //name of the function you are calling in the contract
    .send({ from: connected_evm_account })
	.catch(async (err) => {
		if(typeof err.message !== 'undefined'){
			await alertModal(err.message);
		}
	});

	if(typeof txReceipt.transactionHash !== 'undefined'){
		//show tx hash
		await alertModal(txReceipt.transactionHash);
		return txReceipt.transactionHash;
	}
}


async function getPLSBalance(HTLContract,pls_txid="",pls_scid="",block_number=0) {
	
	if(pls_txid != ""){
		pls_scid = await getContractAddressFromTxId(pls_txid);
	}
	if(block_number == 0){
		block_number = await web3.eth.getBlockNumber();
	}
	const functionSelector = HTLContract.methods.getBalance().encodeABI();

	// Make the eth_call
	const result = await web3.eth.call({
		to: pls_scid,
		data: functionSelector,
	},block_number).catch((err) => {
		if(typeof err.message !== 'undefined'){
			return err.message;
		}
	});	

	if(typeof result !== 'undefined'){
		if(result == "0x"){
			return 0;
		}
		return web3.utils.hexToNumberString(result);
	}else{
		return 0;
	}  
}
let web3contracts = [];
async function getPLSHTLDetails(pls_htl_scid_tx,_pls_amount){
	let plsHTL = {};

	let pls_htl_scid = await getContractAddressFromTxId(pls_htl_scid_tx);
	
	if(!pls_htl_scid){
		
		plsHTL.hash_ok = false;
		plsHTL.balance_ok = false;
		plsHTL.deadline_ok = false;
		plsHTL.key_ok = false;
		
		return plsHTL;
	}

	if(!web3contracts.hasOwnProperty(pls_htl_scid)){
		web3contracts[pls_htl_scid] = new web3.eth.Contract(HTLContractABI, pls_htl_scid);
	}
	let errors = [];
	plsHTL.scid = pls_htl_scid;
	plsHTL.scid_tx = pls_htl_scid_tx;
	plsHTL.hash_ok = true;
	plsHTL.balance_ok = true;
	plsHTL.deadline_ok = true;
	plsHTL.key_ok = true;
	let block_number = 0;

	try {
		block_number = await web3.eth.getBlockNumber();
		[plsHTL.hash, 
		plsHTL.deposited,
		plsHTL.deadline,
		plsHTL.key,
		plsHTL.receiver] = await Promise.all([
			web3contracts[pls_htl_scid].methods.hash().call({}, block_number).catch((err) => {
				if(typeof err.message !== 'undefined'){
					errors.push(err.message);
				}
			}),
			web3contracts[pls_htl_scid].methods.deposited().call({}, block_number).catch((err) => {
				if(typeof err.message !== 'undefined'){
					errors.push(err.message);
				}
			}),
			web3contracts[pls_htl_scid].methods.deadline().call({}, block_number).catch((err) => {
				if(typeof err.message !== 'undefined'){
					errors.push(err.message);
				}
			}),
			web3contracts[pls_htl_scid].methods.key().call({}, block_number).catch((err) => {
				if(typeof err.message !== 'undefined'){
					errors.push(err.message);
				}
			}),
			web3contracts[pls_htl_scid].methods.receiver().call({}, block_number).catch((err) => {
				if(typeof err.message !== 'undefined'){
					errors.push(err.message);
				}
			})
	]);
	} catch (error) {
		if(typeof err.message !== 'undefined'){
			errors.push(error.message);
			console.error('Error:', error);
		}		
	}



	if(typeof plsHTL.deposited !== "undefined"){
		plsHTL.deposited = fromPLSAtomicUnits(plsHTL.deposited);
	}else{
		plsHTL.deposited = 0;
	}	
	
	plsHTL.balance = await getPLSBalance(web3contracts[pls_htl_scid],"",plsHTL.scid,block_number);
	if(!isNaN(plsHTL.balance) && !isNaN(parseFloat(plsHTL.balance))){
		plsHTL.balance = fromPLSAtomicUnits(plsHTL.balance);
	}else{
		errors.push(plsHTL.balance);
	}
	
	if(errors.length > 0){
		plsHTL.error=true
		messages.innerHTML = "";
		for (let error of errors) {
			messages.innerHTML += error + "<hr>";
		}		
	}

	if(plsHTL.hash !="" && plsHTL.hash !== "0x0000000000000000000000000000000000000000000000000000000000000000"){
		plsHTL.hash = plsHTL.hash;
	}else{
		plsHTL.hash_ok = false;
	}
	if(typeof plsHTL.key !== "undefined"){
		if(plsHTL.key == ""){
			plsHTL.key_ok = false;
		}
	}else{
		plsHTL.key_ok = false;
	}
	if(parseInt(plsHTL.deposited) < 1 ||
	_pls_amount != plsHTL.deposited ||
	_pls_amount != plsHTL.balance
	){	
		plsHTL.balance_ok = false;
	}
	
	plsHTL.deadline = parseInt(plsHTL.deadline);
	if(plsHTL.deadline < nowInSeconds()){			
		plsHTL.deadline_ok = false;
	}
	return(plsHTL);
	
}
async function getKeyPLS(pls_txid="",pls_scid="") {
	
	if(pls_txid != ""){
		pls_scid = await getContractAddressFromTxId(pls_txid);
	}
	let HTLContract = new web3.eth.Contract(HTLContractABI, pls_scid);
	let key = await HTLContract.methods.key().call().catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
		}
	});	
	return key;
}
async function getInstalledByteCode(pls_txid="",pls_scid="") {
	let solSCCode = ""
	if(pls_txid != ""){
		pls_scid = await getContractAddressFromTxId(pls_txid);
	}
	solSCCode = await web3.eth.getCode(pls_scid).catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
			solSCCode = ""
		}
	});
	return solSCCode;
}

async function getContractAddressFromTxId(txid){
		let tx = await web3.eth.getTransactionReceipt(txid).catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
			return false;
		}
	});
	return tx.contractAddress;
}
async function checkInstalledByteCode(days,plsHTL) {
	if(!plsHTL){
		return
	}else if(!plsHTL.scid_tx){
		return
	}
	let txRecord = await web3.eth.getTransaction(plsHTL.scid_tx).catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
		}
	});

	let source_code = "0x" + getInstallByteCode(days);
	plsHTL.code = txRecord.data.substring(0, source_code.length);
	plsHTL.code_valid = false;

	if(source_code === plsHTL.code){
		plsHTL.code_valid = true;
		return true;
	}
	return false;
}