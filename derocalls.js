let last_block_update=0;

async function subscribe(){ 
	
	let JSONR = {};
	JSONR.jsonrpc = "2.0";
	JSONR.id = "0";
	JSONR.method = "Subscribe";
	JSONR.params = {};
	JSONR.params = {"Event": "new_topoheight"};
	response = await socketSend(JSONR);
	if(response.result){
		//excellent
	}else if(response.error){
		await alertModal(response.error.message);
	}		
}

async function getHeight(){     
	
	let JSONR = {};
	JSONR.jsonrpc = "2.0";
	JSONR.method = "DERO.GetHeight";
	response = await socketSend(JSONR);
	if(response.result){
		latest_block.innerHTML = response.result.height;
		return response.result.height;
	}else if(response.error){
		await alertModal(response.error.message);
	}		
}


alertTimerId =0;
function myFunction() {
	timer = secs;
	clearTimeout(alertTimerId);
	alertTimerId =  setTimeout(doTime, 1000);  
};

var runit = async function() {
	if(refresh_mode =="timer"){
		if(c_status.classList.contains('ok')){
			await refreshBids("timer");
		}
		myFunction(); 
	}
};

var secs = 30;
var seconds = secs * 1000;
var running = setInterval(runit, secs * 1000);

var timer = secs;

function doTime() { 
	if (--timer >= 0) {
		//Call self every second.
		alertTimerId = setTimeout(doTime, 1000); 
	}
}
window.addEventListener('load', async function () {
setTimeout(await runit(), 2000); 
});

let loading = false;	
let cooked = 0;	
const refreshBids = async function (caller=""){	
	if(caller != refresh_mode && caller != ""){
		return;
	}
	if(loading){		
		if(++cooked > 2){
			loading = false;
			cooked = 0;
		}
		return;
	}
	cooked = 0;
	loading = true;
	let JSONR = {};
	JSONR.jsonrpc = "2.0";
	JSONR.method = "DERO.GetSC";
	JSONR.params = {};
	JSONR.params.scid = "";
	JSONR.params.code = false;
	JSONR.params.variables = true;
	JSONR.params.scid = bids_sc_id;
	refreshbidsbutton.innerText = "Loading..."
	let response = await socketSend(JSONR);
	if(response.result){			
		await displayBids(response.result);		
		if(caller != "topoheight"){
			await getHeight();
		}	
	}
	refreshbidsbutton.innerText = "Refresh Bid List";
	loading = false;	

}
//add a bid	from html inputs
var createbidbutton = document.getElementById('create_bid');    
createbidbutton.addEventListener('click', async function createBid(event) {  
	if(parseFloat(dero_bid_amt.value) == 0 || 
		parseFloat(pls_bid_amt.value) == 0 || 
		dero_bid_amt.value == "" || 
		pls_bid_amt.value == ""		
	){
		await alertModal("Zero? Increase amts.");
		return;
	}else if(banned.find(addr=>addr==connected_dero_account)){
		removeBanHandler();
		return;
	}
	if(bid_switch_mode == "pls-dero" && ! await connectionOK()){
		return;
	}

	if(bid_switch_mode == "pls-dero"){
		real_switch_mode = "dero-pls"
	}else{
		real_switch_mode = "pls-dero"
	}

	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};
	JSONR.params.scid = "";   

	JSONR.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "CreateBid"},
		{Name: "dero_amt", DataType: "U", Value: parseFloat(convertToAtomicUnits(dero_bid_amt.value))},
		{Name: "pls_amt", DataType: "U", Value: parseFloat(pls_bid_amt.value)},
		{Name: "from_to", DataType: "S", Value: real_switch_mode},
		{Name: "pls_bid_address", DataType: "S", Value: connected_evm_account}
	];

	JSONR.params.scid = bids_sc_id;
	JSONR.params.ringsize = 2;

	let response = await socketSend(JSONR);
	if(response.result){
		await alertModal("Offer created, txid:"+response.result.txid);
		await refreshBids();
	}else if(response.error){
		await alertModal(response.error.message);
	}		
	
});

//remove a bid from button in table
async function removeBid(index){
	
	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};
	JSONR.params.scid = "";    

	JSONR.params.sc_rpc = [
	{Name: "entrypoint", DataType: "S", Value: "RemoveBid"},
	{Name: "bid_id", DataType: "S", Value: index},
	];
	JSONR.params.scid = bids_sc_id;
	JSONR.params.ringsize = 2;

	let response = await socketSend(JSONR);
	if(response.result){
		await alertModal("Offer removed, txid:"+response.result.txid);
		await refreshBids();
	}else if(response.error){
		await alertModal(response.error.message);
	}		

}


async function getTxStatus(txid){
	let JSONR = {};
	JSONR.method = "DERO.GetTransaction";
	JSONR.params = {};
	JSONR.params.scid = "";	
	JSONR.params.txs_hashes = [txid];
	let response = await socketSend(JSONR);
	if(response.result){
		if(response.result.status){
			if(response.result.status == "OK"){
				if(response.result.txs != null){
					let tx = response.result.txs[0];
					if ((!tx.in_pool && tx.valid_block=="")||tx.ignored) {
						return false
					}else if(tx.in_pool){
						return false
					}else{
						return true
					}			
				}				
			}
		}
		return false;
	}else if(response.error){
		await alertModal(response.error.message);
		button_states=[]
	}
}

let confirm_height=0;
async function confirmation(txid) {
	confirm_height = await getHeight();
	return new Promise(function (resolve) {		
		let attempts = 0;			
		const attempt = async() => {	
			attempts++;
			let this_height = await getHeight();			
			if(this_height > confirm_height){
				if(attempts > 27){
					clearInterval(retryTimer);
					resolve(false)
				}		
				let status_ok = await getTxStatus(txid)
				if(status_ok){
					clearTimeout(retryTimer);
					resolve(true)
				}
			}
		}
		let retryTimer = setInterval(attempt, 2000)			
	})   
}

async function acceptDeroToPLSOffer(offer){
	if(! await connectionOK()){return false;}
	if(banned.find(addr=>addr==connected_dero_account)){
		removeBanHandler();
		return false;
	}
	//accepter must deploy .sol contract and fund it etc
	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};
	JSONR.params.scid = "";    
	//Also add ETH Address here
	JSONR.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "AcceptBid"},
		{Name: "bid_id", DataType: "S", Value: offer.id},
		{Name: "accepted_by_pls", DataType: "S", Value: connected_evm_account},
	];
	JSONR.params.scid = bids_sc_id;
	JSONR.params.ringsize = 2;
	let response = await socketSend(JSONR);
	if(response.result){
		await alertModal('Wait for your accepted offer to appear in "Active Offers" or "Offers I took", then continue by installing the HTL contract. Accepted TXID:' + response.result.txid);
		document.getElementById("my_taken").click();
	}else if(response.error){
		await alertModal(response.error.message);
		return false;
	}		
}
async function acceptPLSToDeroOffer(offer){
	//Deploy 48hr contract	
	//accepter must deploy dvm contract and fund it etc

	if(! await connectionOK()){return false;}
	if(banned.find(addr=>addr==connected_dero_account)){
		removeBanHandler();
		return false;
	}
	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};
	JSONR.params.scid = "";    
	//Also add ETH Address here
	JSONR.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "AcceptBid"},
		{Name: "bid_id", DataType: "S", Value: offer.id},
		{Name: "accepted_by_pls", DataType: "S", Value: connected_evm_account},
	];
	JSONR.params.scid = bids_sc_id;
	JSONR.params.ringsize = 2;

	let response = await socketSend(JSONR);
	if(response.result){
		await alertModal('Wait for your accepted offer to appear in "Active Offers" or "Offers I took", then continue by installing the HTL contract. Accepted TXID:' + response.result.txid);
		document.getElementById("my_taken").click();		
	}else if(response.error){
		await alertModal(response.error.message);
		return false;
	}		
}	
//Add to bid list after starting and funding hashed time lock contract
async function addSCIDToList(asset,htl_scid,offer){
	//asset should be AddDEROSCID or AddPLSSCID
	
	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};
	JSONR.params.scid = "";    

	JSONR.params.sc_rpc = [
	{Name: "entrypoint", DataType: "S", Value: "Add"+asset+"SCID"},
	{Name: "bid_id", DataType: "S", Value: offer.id},
	{Name: "scid", DataType: "S", Value: htl_scid},
	];
	JSONR.params.scid = bids_sc_id;
	JSONR.params.ringsize = 2;

	let response = await socketSend(JSONR);

	if(response.result){
		let confirmed = await confirmation(response.result.txid);
		let success_msg = "You've posted the "+asset+" smart contract now it needs to be funded to complete this step.";
		let problem_msg = "Failed to post contract id to the index, try again? If not, then you'll need to install another contract.";
		if(confirmed){
			await alertModal(success_msg);
		}else{
			let result = await confirmModal(problem_msg);
			if(result){
				darken_layer.classList.remove("hidden");
				let exists = await contractIdExists(asset,htl_scid,offer.id)
				darken_layer.classList.add("hidden");
				if(!exists){
					darken_layer.classList.remove("hidden");
					await addSCIDToList(asset,htl_scid,offer);
				}else{
					await alertModal(success_msg);
				}
			}else{
				button_states=[]
			}
		}
	}else if(response.error){
		let result = await confirmModal(response.error.message + "<br>" + problem_msg);
		if(result){
			darken_layer.classList.remove("hidden");
			await addSCIDToList(asset,htl_scid,offer);
		}else{
			button_states=[]
		}		
	}
}

async function contractIdExists(asset,htl_scid,offer_id){
	let scidfield = "";
	if(asset == "PLS"){
		scidfield = "pscid"+offer_id
	}else{
		scidfield = "dscid"+offer_id
	}
	let JSONR = {};

	JSONR.method = "DERO.GetSC";
	JSONR.params = {};
	JSONR.params.scid = "";
	JSONR.params.code = false;
	JSONR.params.keysstring = [scidfield];
	JSONR.params.scid = bids_sc_id;
	let response = await socketSend(JSONR);
	
	if(response.result){
		let scid = response.result.valuesstring[0];	
		if(!scid.includes("NOT AVAILABLE")){
			if(htl_scid == hexToUtf8(scid)){
				return true;
			}			
		}
		return false;
	}else if(response.error){
		let result = await confirmModal(response.error.message + " Try again?");
		if(result){
			darken_layer.classList.remove("hidden");
			return await contractIdExists(asset,htl_scid,offer_id);
		}else{
			return false;
		}
		
	}
}
//---------
//get gas fees quote for htl sc installation 

async function installDeroHTL(days_to_lock,dero_receiver_address){   
	let JSONR = {};
	JSONR.method = "DERO.GetGasEstimate";
	JSONR.params = {};
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[] 
	}];
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;	

	JSONR.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "Initialize"},
		{Name: "receiver", DataType: "S", Value: dero_receiver_address},
	];//receiver
	JSONR.params.ringsize = 2;
	JSONR.params.sc = getDeroHTLContract(days_to_lock);

	let response = await socketSend(JSONR);
	if(response.error){
		await alertModal(response.error.message);		
		return false;
	}
	//install htl contract, set the receiver	
	JSONR = {};
	JSONR.method = "transfer";
	JSONR.params = {};
	JSONR.params.fees = 0;
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[] 
	}];
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;
	
	JSONR.params.sc = response.result.gasstorage;
	JSONR.params.sc_rpc = [
		{Name: "entrypoint", DataType: "S", Value: "Initialize"},
		{Name: "receiver", DataType: "S", Value: dero_receiver_address},
	];
	JSONR.params.ringsize = 2;
	JSONR.params.sc = getDeroHTLContract(days_to_lock);
	
	response = await socketSend(JSONR);
	if(response.result){
		let confirmed = await confirmation(response.result.txid);
		if(confirmed){
			await alertModal("Installed with deadline in days: "+days_to_lock);	
			return response.result.txid;				
		}else{
			await alertModal("Can't find the code. Install again. TXID:"+response.result.txid);
			return false;	
		}
	}else if(response.error){
		await alertModal(response.error.message);
		return false;
	}			
}


//Store keys for convenience if you stay on the app.
let keys = [];
async function fundDeroHTL(id,dero_htl_scid,dero_amt,hash) {   
	if(hash.length == 66){
		hash = hash.slice(2);
	}
	let JSONR = {};
	JSONR.method = "scinvoke";
	JSONR.params = {};	
	JSONR.params.scid = "";
	
	JSONR.params.sc_dero_deposit = parseInt(dero_amt);
	JSONR.params.sc_rpc = [
	{Name: "entrypoint", DataType: "S", Value: "StartSwap"},
	{Name: "hash", DataType: "S", Value: hash}
	];
	JSONR.params.scid = dero_htl_scid;
	
	let response = await socketSend(JSONR);
	if(response.result){
		await alertModal("Funds Deposited and locked with provided hash." + "<br> TXID" + response.result.txid);			
		await refreshBids();			
	}else if(response.error){
		await alertModal(response.error.message);
		return false;
	}
}	
async function checkDeroHTLCode(days,deroHTL){	
	let original = getDeroHTLContract(days);
	let installed = deroHTL.code;
	if(original === installed && original !== false){
		deroHTL.code_valid = true;
		return true;
	}
	return false;
}	
async function getDeroHTLCode(dero_htl_scid){	
	let JSONR = {};
	JSONR.method = "DERO.GetSC";
	JSONR.params = {};
	JSONR.params.scid = "";
	JSONR.params.code = true;
	JSONR.params.variables = false;
	JSONR.params.scid = dero_htl_scid;
	let response = await socketSend(JSONR);
	if(typeof response.result !== 'undefined'){
		if(response.result.code != ""){
			return response.result.code;
		}
	}else if(response.error){
		return false;
	}	
	return false;
	
}

async function getDeroHTLDetails(dero_htl_scid,_dero_amount){
	let deroHTL = {};
	let JSONR = {};

	JSONR.method = "DERO.GetSC";
	JSONR.params = {};
	JSONR.params.scid = "";
	JSONR.params.code = true;
	JSONR.params.keysstring = ["hash","deposited","deadline","key","receiver"];
	JSONR.params.scid = dero_htl_scid;
	let response = await socketSend(JSONR);
	if(response.result){
		if(typeof response.result !== 'undefined' && typeof response.result.code !== 'undefined'){		
			deroHTL.code = response.result.code;				
		}else{
			deroHTL.code = "";
		}	
		deroHTL.scid = dero_htl_scid;
		deroHTL.hash_ok = true;
		deroHTL.balance_ok = true;
		deroHTL.deadline_ok = true;
		deroHTL.key_ok = true;
		deroHTL.hash = response.result.valuesstring[0];			
		deroHTL.deposited = response.result.valuesstring[1];
		deroHTL.deadline = response.result.valuesstring[2];
		deroHTL.key = response.result.valuesstring[3];
		deroHTL.receiver = response.result.valuesstring[4];
		if(deroHTL.receiver.length == 132){
			deroHTL.receiver = hexToUtf8(deroHTL.receiver);
		}
		deroHTL.balance = response.result.balance;

		
		if(!deroHTL.hash.includes("NOT AVAILABLE")){
			deroHTL.hash = hexToUtf8(deroHTL.hash);
		}else{
			deroHTL.hash_ok = false;
		}	
		
		if(!deroHTL.key.includes("NOT AVAILABLE")){
			deroHTL.key = hexToUtf8(deroHTL.key);
		}else{
			deroHTL.key_ok = false;
			deroHTL.key = "";
		}	
		
		deroHTL.deposited =	parseInt(deroHTL.deposited);			
		if(deroHTL.deposited < 1 ||
		_dero_amount != deroHTL.deposited ||
		_dero_amount != deroHTL.balance
		){	
			deroHTL.balance_ok = false;
		}
		
		deroHTL.deadline =	parseInt(deroHTL.deadline);
		if(deroHTL.deadline < nowInSeconds()){				
			deroHTL.deadline_ok = false;
		}
		return(deroHTL);	
	}else if(response.error){
		let deroHTL = {};
		deroHTL.scid = dero_htl_scid;
		deroHTL.hash_ok = false;
		deroHTL.balance_ok = false;
		deroHTL.deadline_ok = false;
		deroHTL.key_ok = false;
		deroHTL.error = true;
		messages.innerHTML = response.error.message;
		return deroHTL;
	}
}
async function deroWithdrawal(key,dero_htl_scid) {  		  

	let JSONR = {};
	JSONR.jsonrpc = "2.0";
	JSONR.id = 5;
	JSONR.method = "DERO.GetGasEstimate";
	JSONR.params = {};	
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[]
	}];	
	
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;		
  
	JSONR.params.sc_rpc = [
	{Name: "SC_ACTION", DataType: "U", Value: 0},
	{Name: "SC_ID", DataType: "H", Value: dero_htl_scid},
	{Name: "entrypoint", DataType: "S", Value: "Withdraw"},
	{Name: "key", DataType:"S", Value: String(key)},
	];	
	JSONR.params.ringsize = 2;
	JSONR.params.signer = connected_dero_account;
	
	let response = await socketSend(JSONR);
	if(response.error){
		await alertModal(response.error.message);
		return;
	}
	JSONR = {};
	JSONR.jsonrpc = "2.0";
	JSONR.id = 6;
	JSONR.method = "transfer"
	JSONR.params = {};
	
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[]
	}];	
	
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;	    
   
	JSONR.params.sc_rpc = [
	{Name: "SC_ACTION", DataType: "U", Value: 0},
	{Name: "SC_ID", DataType: "H", Value: dero_htl_scid},
	{Name: "entrypoint", DataType: "S", Value: "Withdraw"},
	{Name: "key", DataType:"S", Value: String(key)},
	];	
	JSONR.params.ringsize = 2;
	JSONR.params.signer = connected_dero_account;
	JSONR.params.fees = response.result.gasstorage;

	response = await socketSend(JSONR);
	if(response.result){
		await alertModal(response.result.txid);
		return response.result.txid;
	}else if(response.error){
		await alertModal(response.error.message);
		return "";
	}	
};

async function refundDero(dero_htl_scid) {   
	let JSONR = {};
	JSONR.method = "DERO.GetGasEstimate";
	JSONR.params = {};	
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[]
	}];	
	
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;
	JSONR.params.sc_rpc = [
	{Name: "SC_ACTION", DataType: "U", Value: 0},
	{Name: "SC_ID", DataType: "H", Value: dero_htl_scid},
	{Name: "entrypoint", DataType: "S", Value: "Refund"},
	];	
	JSONR.params.ringsize = 2;
	JSONR.params.signer = connected_dero_account;
	//current_mode = "refund";
	let response = await socketSend(JSONR);
	if(response.error){
		await alertModal(response.error.message);
		return;
	}
	JSONR = {};
	JSONR.method = "transfer"
	JSONR.params = {};
	
	JSONR.params.transfers = [{
		destination: rando_dest,
		amount:0,
		Burn:0,
		payload_rpc:[]
	}];	
	
	JSONR.params.sc = "";
	JSONR.params.sc_value = 0;  
	JSONR.params.sc_rpc = [
	{Name: "SC_ACTION", DataType: "U", Value: 0},
	{Name: "SC_ID", DataType: "H", Value: dero_htl_scid},
	{Name: "entrypoint", DataType: "S", Value: "Refund"},
	];	
	JSONR.params.ringsize = 2;
	JSONR.params.signer = connected_dero_account;
	JSONR.params.fees = response.result.gasstorage;

	response = await socketSend(JSONR);
	if(response.result){
		await alertModal("Refund Successful with TXID:"+response.result.txid);
	}else if(response.error){
		await alertModal(response.error.message);
	}		
	
};

//--Smart Contract
function getDeroHTLContract(days){
	if(days === 1){
		return dero1daycontract;
	}else if(days === 2){
		return dero2daycontract;
	}else{
		return false;
	}
}