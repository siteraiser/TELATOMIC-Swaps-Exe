//--------------------------------
//--Extras------------------------
let ban_user_button = document.getElementById("ban_user");	
let unban_user_button = document.getElementById("unban_user");	
ban_user_button.addEventListener("click", async function() {

	let ransom = await promptModal("Enter an amount to pay (a donation to the developer) and the wallet to ban. They will have to pay the same amount to recover their listing privilidges. Enter their ransom fee (minimum .00325 Dero):",[1,""],{"class":"ban_user"},
	function (){
	document.querySelector(".ban_user input").addEventListener('input', validateAmount, false);
	document.querySelector(".ban_user input").addEventListener('keyup', validateAmount, false);
	document.querySelector(".ban_user input").addEventListener('focusout', validateAmount, false);	
	document.querySelectorAll(".ban_user input")[1].setAttribute("placeholder", "Dero Address to Ban")
	});
	if(ransom!=null){
		await banAddress(ransom[0],ransom[1]);
	}

});
	async function banAddress(ransom,address) {  
		if(
		parseFloat(ransom) < .00325 || 
		address.length != 66		
		){ 
			await alertModal("Incorrect details");
			return;
		}
		
		let banJSON = {};
		banJSON.jsonrpc = "2.0";
		banJSON.id = 9;
		banJSON.method = "scinvoke";
		banJSON.params = {};
		
		banJSON.params.scid = "";   
		banJSON.params.sc_dero_deposit = parseInt(convertToAtomicUnits(ransom));
		banJSON.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "AddBan"},
		{Name: "banned", DataType: "S", Value: address}
		];

		banJSON.params.scid = bids_sc_id;
		banJSON.params.ringsize = 2;
		let response = await socketSend(banJSON);
		if(response.result){
			await alertModal("User Ban Processed, Thanks! txid:"+response.result.txid);
			await refreshBids();
		}else if(response.error){
			await alertModal(response.error.message);
		}		
		
	}

	async function recoverAddress(ransom,address) {  
		if(
		parseFloat(ransom) == 0 || 
		address.length != 66		
		){ 
			await alertModal("Incorrect details");
			return;
		}
		
		let banJSON = {};
		banJSON.jsonrpc = "2.0";
		banJSON.id = 9;
		banJSON.method = "scinvoke";
		banJSON.params = {};
		
		banJSON.params.scid = "";   
		banJSON.params.sc_dero_deposit = parseInt(ransom);
		banJSON.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "RemoveBan"},
		{Name: "banned", DataType: "S", Value: address}
		];

		banJSON.params.scid = bids_sc_id;
		banJSON.params.ringsize = 2;
		let response = await socketSend(banJSON);
		if(response.result){
			await alertModal(address +" unbanned, behave yourself and thanks for the dono! txid:"+response.result.txid);
		}else if(response.error){
			await alertModal(response.error.message);
		}		
		
	}
	async function getBanDetails(address) {  

	let getBanJSON = {};
		getBanJSON.jsonrpc = "2.0";
		
		getBanJSON.id = 11;
		getBanJSON.method = "DERO.GetSC";
		getBanJSON.params = {};
		getBanJSON.params.scid = "";
		getBanJSON.params.code = false;
		getBanJSON.params.variables = true;
		getBanJSON.params.scid = bids_sc_id;
		let response = await socketSend(getBanJSON);
		if(response.result){
			let amount=0;
			Object.keys(response.result.stringkeys).forEach(index => {	

				if(index.includes("ban"+address)){	
					//get sc index
					amount = hexToUtf8(response.result.stringkeys[index]);		
				}					
			
			});
			return(amount);	
		}else if(response.error){
			await alertModal(response.result.error.message);
		}		
		
	}
	
	unban_user_button.addEventListener("click", async function() {
		removeBanHandler();

	});
	

	

	let declined = false;
	async function removeBanHandler(){

		let ransom = await getBanDetails(connected_dero_account);
		if(ransom == 0){
			await alertModal("Your wallet is not banned");	
			return;
		}
		let proceed = "";
		proceed = await confirmModal("Would you like to unban your wallet for the price of: "+convertToDeroUnits(ransom)+"Dero?");	
		if(proceed){
			await recoverAddress(ransom,connected_dero_account);
		}else{
			declined = true;
		}
	}
//--------------------------

let e_withdrawal = document.getElementById("e_withdrawal");

e_withdrawal.addEventListener("click", async function() {
	if(! await connectionOK()){return false;}
	let fields = await promptModal("Attempt emergency withdrawal. Enter the Dero and PulseChain SCIDs from the contract ids download:",["",""],{"class":"e_withdrawal"},
	function (){
	document.querySelectorAll(".e_withdrawal input")[0].setAttribute("placeholder", "Dero SCID")
	document.querySelectorAll(".e_withdrawal input")[1].setAttribute("placeholder", "PLS SCID")
	});
	await emergencyWithdrawal(fields[0],fields[1]);

});


async function emergencyWithdrawal(dero_htl_scid,pls_htl_scid){
	let pkey = false;
	let dkey = await getDeroKey(dero_htl_scid);
	if(!dkey){
		pkey = await getPLSKey(pls_htl_scid);
	}
	if(!dkey && !pkey){
		await alertModal("Key not available. The other user has not withdrawn, providing you the key yet.");
		return
	}else if(dkey){
		//withdraw pls with dkey 
		let txHashReceipt = await plsWithdrawal(dkey,"",pls_htl_scid);
		if(txHashReceipt !=''){
			await alertModal("TXID:"+txHashReceipt);
		}else{
			await alertModal("Error Occurred, try again if your funds haven't arrived.");
		}		
	}else{
		//withdraw dero with pkey 
		await deroWithdrawal(pkey,dero_htl_scid);
	}
	
}

async function getDeroKey(dero_htl_scid){

	let getHashJSON = {};
	getHashJSON.jsonrpc = "2.0";
	getHashJSON.method = "DERO.GetSC";
	getHashJSON.params = {};
	getHashJSON.params.scid = "";
	getHashJSON.params.code = false;
	getHashJSON.params.keysstring = ["key"];
	getHashJSON.params.scid = dero_htl_scid;
	let response = await socketSend(getHashJSON);
	if(response.result){
		let key_ok = true;
		let key = response.result.valuesstring[0];	
		if(key.includes("NOT AVAILABLE")){
			key_ok = false;
			
		}
		if(key_ok){
			return hexToUtf8(key);
		}
		return false;
	}else if(response.error){
		await alertModal(response.result.error.message);
	}		
}


async function getPLSKey(pls_htl_scid){

	let key_ok = true;
	let key = "";
	
	let HTLContract = new web3.eth.Contract(HTLContractABI, pls_htl_scid);
	
	key = await HTLContract.methods.key().call().catch((err) => {
		if(typeof err.message !== 'undefined'){
			messages.innerHTML = err.message;
		}
	});	
	

	if(typeof key !== "undefined"){
		if(key == ""){
			key_ok = false;
		}
	}else{
		key_ok = false;
	}
	if(key_ok){
		return key;
	}
	return false;
	
}