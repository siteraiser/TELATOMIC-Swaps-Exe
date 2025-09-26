
//--------------------------	
//--Get action functions----	
//--------------------------
let button_states=[]

function getAcceptButton(action_button,offer){
	//Someone else's offer that is waiting for a taker	
	action_button.textContent = "Accept";
	action_button.addEventListener("click", function() {
		action_button.disabled = true;
		button_states[offer.id] = action_button.textContent;
		acceptBid(
			offer
		);
	});
}



function getRemoveBidButton(action_button,offer,deadline){
	action_button.textContent = "Remove";
	action_button.setAttribute("index", offer.id);					
	action_button.addEventListener("click", function() {
		action_button.disabled = true;
		button_states[offer.id] = action_button.textContent;
		removeBid(offer.id);
	});		
}
//taker buttons --
//pls-dero
async function getInstallDeroHTLButton(action_button,offer){
	action_button.addEventListener("click",async function() {
		action_button.disabled = true;
		darken_layer.classList.remove("hidden");		
		button_states[offer.id] = action_button.textContent;
		let dero_htl_txid = await installDeroHTL(2,offer.dero_bid_address);		
		if(dero_htl_txid == false){
			darken_layer.classList.add("hidden");
			action_button.disabled = false;
			delete button_states[offer.id]
			return false;
		}
		darken_layer.classList.remove("hidden");
		await addSCIDToList("DERO",dero_htl_txid,offer);
		darken_layer.classList.add("hidden");
		action_button.textContent = "Waiting for update";
		action_button.disabled = true;
		button_states[offer.id] = action_button.textContent;

	});
 }
//dero-pls
async function getInstallPLSHTLButton(action_button,offer){
	action_button.addEventListener("click",async function() {
		action_button.disabled = true;
		darken_layer.classList.remove("hidden");
		button_states[offer.id] = action_button.textContent;
		let pls_htl_txid = await installPLSHTL(2,offer.pls_bid_address);		
		if(pls_htl_txid == false){
			darken_layer.classList.add("hidden");
			action_button.disabled = false;
			delete button_states[offer.id]
			return false;
		}
		await alertModal("Next step, approve SC listing TX in Dero wallet.");
		darken_layer.classList.remove("hidden");
		await addSCIDToList("PLS",pls_htl_txid,offer);
		darken_layer.classList.add("hidden");
		action_button.textContent = "Waiting for update";
		action_button.disabled = true;
		button_states[offer.id] = action_button.textContent;
		
	});	
}
 	
//taker-pls-dero
 async function getFundDeroHTLButton(action_button,offer){
	 action_button.addEventListener("click", async function() {
		let hash = "";
		let key = await promptModal(
			"Please create a key (32 chars max) for generating the hash for bid id:" + offer.id, randomString(32),
			{"class":"keygen"},
			function (){document.querySelector(".keygen input").setAttribute("type", "text")}
		);		
		if (getByteLength(key) > 32){
			await alertModal("Value too large.");								
			return;
		}
		if (key != null) {
			darken_layer.classList.remove("hidden");
			hash = await generateSHA256Hash(key.toString());
			let pre = document.createElement("pre");
			pre.innerText = key;
			await alertModal(`Save your key in case you leave the app. key:${pre.outerHTML} hash:${hash} for swap id:${offer.id} <br>` + 
				createDownloadLink(offer.id,key,offer.dscid).outerHTML
			);
			
			darken_layer.classList.remove("hidden");
			keys[offer.id] = key;
			button_states[offer.id] = action_button.textContent;
			let dero_htl_tx = await fundDeroHTL(offer.id,offer.dscid,offer.deroamt,hash)
			if(dero_htl_tx == false){
				await alertModal("Funding failed");
				delete button_states[offer.id]
				action_button.disabled = false
				return;
			}			
			await alertModal(`Funding succesful. Wait for the other party to deploy a contract with your funds to be unlocked with your key. ${pre.outerHTML}`);			
			await refreshBids();
		}else{
			return;
		}		
	})
}
//dero-pls
 async function getFundPLSHTLButton(action_button,offer,pls_scid){
	action_button.addEventListener("click", async function() {
		//maybe check if it funded first here in case of delay
		let hash = "";
		let key = await promptModal(
			"Please create a key (32 chars max) for generating the hash for bid id:" + offer.id, randomString(32), 
			{"class":"keygen"},
			function (){document.querySelector(".keygen input").setAttribute("type", "text")}
		);
		if (getByteLength(key) > 32){
			await alertModal("Value too large.");								
			return;
		}
		
		if (key != null) {
			darken_layer.classList.remove("hidden");
			hash = await generateSHA256Hash(key.toString());
			let pre = document.createElement("pre");
			pre.innerText = key;
			await alertModal(`Save your key in case you leave the app. key:${pre.outerHTML} hash:${hash} for swap id:${offer.id} <br>` +
			createDownloadLink(offer.id,key,offer.pscid).outerHTML );
			darken_layer.classList.remove("hidden");
			keys[offer.id] = key;			
			button_states[offer.id] = action_button.textContent;
			let pls_htl_tx = await fundPLSHTL(offer.id,pls_scid,offer.plsamt,hash);
			if(pls_htl_tx == false){
				await alertModal("Funding failed");
				delete button_states[offer.id]
				action_button.disabled = false
				return;
			}			
			await alertModal(`Funding succesful. Wait for the other party to deploy a contract with your funds to be unlocked with your key. ${pre.outerHTML}`);
			await refreshBids();
		}else{
			return;
		}
		
	});
}
//waiting for other sc...
//taker-pls-dero
async function getWaitingForPLSSCButton(action_button,offer,dero_deadline){
	action_button.addEventListener("click", async function() {
	await alertModal("The maker of the offer should now deploy a PLS htl contract using the hash you provided. When that is unlocked with the key you have, then they will have the key for what you locked up. Otherwise your "+convertToDeroUnits(offer.deroamt)+" Dero will be refundable in "+niceRound(Number((dero_deadline - nowInSeconds())/3600).toFixed(1))+" hours");
	});
}
//dero-pls
async function getWaitingForDeroSCButton(action_button,offer,pls_deadline){
	//let pls_deadline = plsHTL.deadline;//save variable for button
	action_button.addEventListener("click", async function() {
		await alertModal("The maker of the offer should now deploy a Dero htl contract using the hash you provided. When that is unlocked with the key you have, then they will have the key for what you locked up. Otherwise your "+offer.plsamt+" PLS will be refundable in "+niceRound(Number((pls_deadline - nowInSeconds())/3600).toFixed(1))+" hours");
	});
}
//taker-pls-dero
async function getWithdrawPLSButton(action_button,offer){
	action_button.addEventListener("click",async function() {		
		let key_text="";
		if(typeof keys[offer.id] != "undefined"){
			key_text = keys[offer.id];
		}
		let key = await promptModal((key_text == ""?"Please enter the key to u":"U")+"nlock offer with Id:" + offer.id, key_text);		
		if (key != null) {			
			darken_layer.classList.remove("hidden");
			button_states[offer.id] = action_button.textContent;
			let txHashReceipt = await plsWithdrawal(key,offer.pscid);
			if(txHashReceipt !=''){							
				await alertModal("TXID:"+txHashReceipt);
				refreshBids();
			}else{
				delete button_states[offer.id]
				await alertModal("Error Occurred, try again if your funds haven't arrived.");
			}
		}else{
			return;
		}											
	});
}
//taker-dero-pls
async function getWithdrawDeroButton(action_button,offer){
	action_button.addEventListener("click",async function() {		
		let key_text="";
		if(typeof keys[offer.id] != "undefined"){
			key_text = keys[offer.id];
		}
		let key = await promptModal((key_text == ""?"Please enter the key to u":"U")+"nlock offer with Id:" + offer.id, key_text);
		
		if (key != null) {
			darken_layer.classList.remove("hidden");
			button_states[offer.id] = action_button.textContent;
			let txHash = await deroWithdrawal(key,offer.dscid);
			if(txHash !=''){
				await alertModal("TXID:"+txHash);
				refreshBids();
			}else{
				delete button_states[offer.id]
				await alertModal("Error Occurred, try again if your funds haven't arrived.");
			}
		}else{
			return;
		}	
	});
}





//--(maker)----	
//pls-dero
async function getMakerPDInstallButton(action_button,offer,deadline,hashvalue){
	var timeleft = niceRound(Number((deadline - one_and_a_half_days_in_secs - nowInSeconds())/3600).toFixed(1));
	var timeleftfordeadline = niceRound(Number((deadline - one_day_in_secs - nowInSeconds())/3600).toFixed(1));
	
	action_button.textContent = "Install PLS SC - Hours left: "+timeleft;
	if(timeleft <= 0){
		action_button.textContent = "Expired";
	}
	action_button.addEventListener("click",async function() {
		action_button.disabled = true;
		let result = await confirmModal("<b>IMPORTANT:</b> "+timeleft+" hours left to safely install and lock your deposit of "+offer.plsamt+"PLS. If the other party waits until the last minute to cash out, you will have "+timeleftfordeadline+" hours to claim your Dero before you risk losing the funds. They can claim a refund after their 48 hour lockup for you is up. Ensure you can be available to complete your withdrawal when it is ready!<br> Start 1 day PLS contract and fund it with "+ offer.plsamt +" for PLS address: "+ offer.accepted_pls_address +" using hash value: "+hashvalue+". Are you sure you want to continue?");//
		if (result) {	
			
			await alertModal("Installing PLS stage 2 contract with one day lock period");
			darken_layer.classList.remove("hidden");
			let pls_htl_scid_tx = await installPLSHTL(1,offer.accepted_pls_address);				
			if(pls_htl_scid_tx == false){
				action_button.disabled = false;
				return;
			}
			await alertModal("Next step, approve SC listing TX in Dero wallet.");
			await addSCIDToList("PLS",pls_htl_scid_tx,offer);
			action_button.disabled = true;
			action_button.textContent = "Waiting for update";
			button_states[offer.id] = action_button.textContent;
		}else{
			action_button.disabled = false;
			return;
		}			
	});		
}
//dero-pls	
async function getMakerDPInstallButton(action_button,offer,deadline,hashvalue){	
	var timeleft = niceRound(Number((deadline - one_and_a_half_days_in_secs - nowInSeconds())/3600).toFixed(1));
	var timeleftfordeadline = niceRound(Number((deadline - one_day_in_secs - nowInSeconds())/3600).toFixed(1));
	
	action_button.textContent = "Install DERO SC - Hours left:"+timeleft;
	if(timeleft <= 0){
		action_button.textContent = "Expired";
	}
	action_button.addEventListener("click",async function() {
		action_button.disabled = true;
		let result = await confirmModal("<b>IMPORTANT:</b> "+timeleft+" hours left to safely install and lock your deposit of "+convertToDeroUnits(offer.plsamt)+"Dero. If the other party waits until the last minute to cash out, you will have "+timeleftfordeadline+" hours to claim your PLS before you risk losing the funds. They can claim a refund after their 48 hour lockup for you is up. Ensure you can be available to complete your withdrawal when it is ready!<br> Start 1 day Dero contract and fund it with "+ convertToDeroUnits(offer.deroamt) +" for Dero address: "+ offer.accepted_dero_address +" using hash value: "+hashvalue+". Are you sure you want to continue?");//
		if (result) {
			await alertModal("Installing Dero stage 2 contract with one day lock period");
			darken_layer.classList.remove("hidden");
			let dero_htl_scid = await installDeroHTL(1,offer.accepted_dero_address);				
			if(dero_htl_scid == false){
				action_button.disabled = false;
				return;
			}
			await alertModal("Next step, approve SC listing TX in Dero wallet.");
			await addSCIDToList("DERO",dero_htl_scid,offer);
			action_button.disabled = true;
			action_button.textContent = "Waiting for update";
			button_states[offer.id] = action_button.textContent;
		}else{
			action_button.disabled = false;
			return;
		}		
	});			
}	
//Finish 
//pls-dero obviously...
async function getMakerPDFundButton(action_button,offer,deroHTL,plsHTL){
	var timeleft = niceRound(Number((deroHTL.deadline - one_and_a_half_days_in_secs - nowInSeconds())/3600).toFixed(1));
	var timeleftfordeadline = niceRound(Number((deroHTL.deadline - one_day_in_secs - nowInSeconds())/3600).toFixed(1));
	action_button.textContent = "Fund PLS HTL Contract - Hours left: "+timeleft;
	if(timeleft <= 0){
		action_button.textContent = "Expired";
	}		
	action_button.addEventListener("click",async function() {
		action_button.disabled = true;
		let result = await confirmModal("<b>IMPORTANT:</b> "+timeleft+" hours left to deposit "+offer.plsamt+"PLS, leaving "+timeleftfordeadline+" hours to claim your Dero (after they cash out the PLS providing you the key) before you risk losing your funds. If they wait until the last minute to claim their funds (24 hours from now) and their 48 hour lock time is up after deploying their contract they can get their Dero refunded back too. <br> Are you sure you want to continue? <br>Save swap details for extra precaution (see guide): "+createMakerDownloadLink(offer.id,deroHTL.scid,plsHTL.scid).outerHTML );
		if (result) {				
			await alertModal("Funding PLS stage 2 contract with one day lock period");
			darken_layer.classList.remove("hidden");
			button_states[offer.id] = action_button.textContent;
			let pls_htl_tx = await fundPLSHTL(offer.id,plsHTL.scid,offer.plsamt,deroHTL.hash);		
			if(pls_htl_tx == false){
				await alertModal("Funding failed");
				action_button.disabled = false;
				delete button_states[offer.id]
				return;
			}
			await alertModal("Funding succesful, please wait diligently for the key to be unlocked so you can get your funds.");
		}else{
			action_button.disabled = false;
			return;
		}			
	});		
}
//dero-pls
async function getMakerDPFundButton(action_button,offer,deroHTL,plsHTL){
	var timeleft = niceRound(Number((plsHTL.deadline - one_and_a_half_days_in_secs - nowInSeconds())/3600).toFixed(1));
	var timeleftfordeadline = niceRound(Number((plsHTL.deadline - one_day_in_secs - nowInSeconds())/3600).toFixed(1));
	action_button.textContent = "Fund Dero HTL Contract - Hours left: "+timeleft;
	if(timeleft <= 0){
		action_button.textContent = "Expired";
		action_button.disabled = true;
	}		
	action_button.addEventListener("click",async function() {
	action_button.disabled = false;
	let result = await confirmModal("<b>IMPORTANT:</b> "+timeleft+" hours left to deposit "+convertToDeroUnits(offer.deroamt)+"Dero, leaving "+timeleftfordeadline+" hours to claim your PLS (after they cash out the Dero providing you the key) before you risk losing your funds. If they wait until the last minute to claim their funds (24 hours from now) and their 48 hour lock time is up after deploying their contract they can get their PLS refunded back too. <br> Are you sure you want to continue? <br>Save swap details for extra precaution (see guide): "+createMakerDownloadLink(offer.id,deroHTL.scid,plsHTL.scid).outerHTML );
		if (result) {				
			await alertModal("Funding Dero stage 2 contract with one day lock period");
			darken_layer.classList.remove("hidden");
			button_states[offer.id] = action_button.textContent;
			let dero_htl_tx = await fundDeroHTL(offer.id,deroHTL.scid,offer.deroamt,plsHTL.hash)
			if(dero_htl_tx == false){
				await alertModal("Funding failed");
				action_button.disabled = false;
				delete button_states[offer.id]
				return;
			}
			await alertModal("Funding succesful, please wait diligently for the key to be unlocked so you can get your funds.");
		}else{
			action_button.disabled = false;
			return;
		}			
	});		
}
