let rows = []
let completed_offers = []
let banned=[]
//creates table and various buttons
async function displayBids(res){
	let indexes = []
	let dero_bid_addresses=[]
	let pls_bid_addresses=[]
	let deroamts=[]
	let plsamts=[]
	let from_tos=[]
	let accepted_dero_addresses=[]
	let accepted_pls_addresses=[]
	let dscids=[]
	let pscids=[]	
	banned=[]
	resetStatus()
	Object.keys(res.stringkeys).forEach(index => {
		if(index.substring(0,3)==="ban"){
			banned.push(index.substring(3,69))
			if(index.substring(3,69)==connected_dero_account&&!declined){
				removeBanHandler()
			}
		}
		if(index.includes("from_to")){
			indexes.push(index.slice(7))
			from_tos[index.slice(7)]=(hexToUtf8(res.stringkeys[index]))	
		}
		if(index.includes("deroamt")){
			 deroamts[index.slice(7)]=res.stringkeys[index]
		}else
		if(index.includes("plsamt")){
			plsamts[index.slice(6)]=res.stringkeys[index]
		}else
		if(index.includes("dero_bid_address")){
			dero_bid_addresses[index.slice(16)]=hexToUtf8(res.stringkeys[index])
		}else
		if(index.includes("pls_bid_address")){
			pls_bid_addresses[index.slice(15)]=hexToUtf8(res.stringkeys[index])
		}else
		if(index.includes("accepted_by_dero")){
			accepted_dero_addresses[index.slice(16)]=hexToUtf8(res.stringkeys[index])
		}else
		if(index.includes("accepted_by_pls")){
			accepted_pls_addresses[index.slice(15)]=hexToUtf8(res.stringkeys[index])
		}else
		if(index.includes("dscid")){
			dscids[index.slice(5)]=hexToUtf8(res.stringkeys[index])
		}else
		if(index.includes("pscid")){
			pscids[index.slice(5)]=hexToUtf8(res.stringkeys[index])
		}
	})
	var offers=[]
	for (const i of indexes) {
		if(typeof accepted_dero_addresses[i]==="undefined"){
			accepted_dero_addresses[i]=""
		}
		if(typeof accepted_pls_addresses[i]==="undefined"){
			accepted_pls_addresses[i]=""
		}
		if(typeof dscids[i]==="undefined"){
			dscids[i]="waiting"
		}
		if(typeof pscids[i]==="undefined"){
			pscids[i]="waiting"
		}
		var offer=[]
		if (completed_offers.hasOwnProperty(i)){
			offer = completed_offers[i]
		}else if(accepted_dero_addresses[i]!=""||accepted_pls_addresses[i]!=""||!banned.find(addr=>addr==dero_bid_addresses[i])){
			offer={
				"id" : i,
				"dero_bid_address":dero_bid_addresses[i],
				"pls_bid_address":pls_bid_addresses[i],
				"deroamt":deroamts[i],
				"plsamt":plsamts[i],
				"from_to":from_tos[i],
				"accepted_dero_address":accepted_dero_addresses[i],
				"accepted_pls_address":accepted_pls_addresses[i],
				"dscid":dscids[i],
				"pscid":pscids[i],
				"deadline":0
			}
		}
		filterOffers(offer,offers)
	}	
	sortOffers(offers)
	
	for (let i in offers) {
		let offer=offers[i]
		let offer_text=""
		if(offer.from_to=="dero-pls"){
			offer_text="Get "+convertToDeroUnits(offer.deroamt)+"DERO for "+offer.plsamt+"PLS"
		}else if(offer.from_to=="pls-dero"){
			offer_text="Get "+offer.plsamt+"PLS for "+convertToDeroUnits(offer.deroamt)+"DERO"
		}
		let action_button=document.createElement('button')		
		action_button.disabled=true;
		if(offer.done){
			action_button.innerText="Status Complete"
		}else if(offer.expired){
			action_button.innerText="Expired"
		}else if(offer.problem){
			action_button.innerText="Problem with SC"
		}else{
			action_button.disabled=false
			var deroHTL={};var plsHTL={}
			if(offer.dero_bid_address==connected_dero_account){
				if(offer.accepted_dero_address!=""&&offer.dscid=="waiting"&&offer.pscid=="waiting"){
					if(offer.from_to=="pls-dero"){
						action_button.textContent="Waiting for taker to finish Dero SC"
					}else if(offer.from_to=="dero-pls"){
						action_button.textContent = "Waiting for taker to finish PLS SC"
					}
				}else if(offer.accepted_dero_address==""){
					getRemoveBidButton(action_button,offer)
				}
				if(offer.from_to=="pls-dero"&&offer.dscid!="waiting"&&offer.pscid=="waiting"){
					var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
					await checkDeroHTLCode(2,deroHTL)
					offer.deadline=deroHTL.deadline
					if(!deroHTL.deadline_ok&&!deroHTL.balance_ok&&!deroHTL.hash_ok){
						action_button.textContent="Waiting for deposit"
					}else if(!deroHTL.deadline_ok&&deroHTL.code_valid&&deroHTL.hash_ok){
						action_button.textContent="Expired"
					}else if(!deroHTL.balance_ok&&deroHTL.code_valid){
						action_button.textContent="Waiting for Dero HTL to be funded"
					}else if(deroHTL.code_valid&&deroHTL.receiver==connected_dero_account){
						getMakerPDInstallButton(action_button,offer,deroHTL.deadline,deroHTL.hash)
					}else if(!deroHTL.code_valid){
						action_button.textContent = "Problem with SC"
					}
				}else 
				if(offer.from_to=="dero-pls"&&offer.pscid!="waiting"&&offer.dscid=="waiting"){
					var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
					await checkInstalledByteCode(2,plsHTL)
					offer.deadline = plsHTL.deadline
					if(!plsHTL.deadline_ok&&!plsHTL.balance_ok&&!plsHTL.hash_ok){						
						action_button.textContent="Waiting for deposit"
					}else if(!plsHTL.deadline_ok&&plsHTL.code_valid&&plsHTL.hash_ok){												
						action_button.textContent = "Expired"
					}else if(!plsHTL.balance_ok&&plsHTL.code_valid){
						action_button.textContent="Waiting for PLS HTL to be funded";
					}else if(plsHTL.code_valid&&plsHTL.receiver==connected_evm_account){
						getMakerDPInstallButton(action_button,offer,plsHTL.deadline,plsHTL.hash)
					}else if(plsHTL.code_valid){
						action_button.textContent="Connect MetaMask to Continue"
					}else if(!plsHTL.code_valid){
						action_button.textContent="Problem with SC"
					}
				}else			
				if(offer.dscid!="waiting"&&offer.pscid!="waiting"){			
					if(offer.from_to=="pls-dero"){
						var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
						await checkInstalledByteCode(1,plsHTL)						
						var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
						await checkDeroHTLCode(2,deroHTL)						
						offer.deadline=deroHTL.deadline
						if(plsHTL.key_ok&&deroHTL.code_valid&&deroHTL.balance_ok){
							let key=plsHTL.key
							action_button.textContent="Withdraw DERO"
							action_button.addEventListener("click",async function(){
								action_button.disabled=true
								await deroWithdrawal(key,offer.dscid)
								await refreshBids()
							})							
						}else if(plsHTL.code_valid&&!plsHTL.balance_ok&&!plsHTL.hash_ok&&!plsHTL.deadline_ok){
							if(deroHTL.code_valid && deroHTL.deadline_ok && deroHTL.balance_ok && deroHTL.hash_ok){							
								await getMakerPDFundButton(action_button,offer,deroHTL,plsHTL)			
							}else{
								action_button.textContent="Expired"
							}
						}else if(plsHTL.code_valid && plsHTL.balance_ok && plsHTL.deadline_ok){
							action_button.textContent="Waiting for key ("+niceRound(Number((plsHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours before refundable)"
						}else if(!plsHTL.code_valid){
							action_button.textContent="Problem with SC"
						}else if(plsHTL.balance_ok&&!plsHTL.deadline_ok){
							action_button.textContent="Refund"
							action_button.addEventListener("click",async function(){
								darken_layer.classList.remove("hidden");
								await refundPLS(offer.pscid)
								await refreshBids()
							})
						}else{
							action_button.textContent="Status Complete"
						}							
					}else					
					if(offer.from_to=="dero-pls"){
						
						var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
						await checkDeroHTLCode(1,deroHTL)
						var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
						await checkInstalledByteCode(2,plsHTL)
						
						offer.deadline = deroHTL.deadline;
						if(deroHTL.key_ok&&plsHTL.code_valid&&plsHTL.balance_ok){						
							if(connected_evm_account==""){
							 	action_button.textContent="Connect MetaMask to withdraw PLS"
							}else{
								let key=deroHTL.key
								action_button.textContent = "Withdraw PLS"
								action_button.addEventListener("click",async function(){
									action_button.disabled=true
									await plsWithdrawal(key,offer.pscid)
									await refreshBids()
								})
							}
						}else if(deroHTL.code_valid&&!deroHTL.balance_ok&&!deroHTL.hash_ok&&!deroHTL.deadline_ok){						
							if(plsHTL.code_valid&&plsHTL.deadline_ok&&plsHTL.balance_ok&&plsHTL.hash_ok){
								await getMakerDPFundButton(action_button,offer,deroHTL,plsHTL)								
							}else{
								action_button.textContent="Expired"
							}
						}else if(deroHTL.code_valid&&deroHTL.balance_ok&&deroHTL.deadline_ok){
							action_button.textContent="Waiting for key ("+niceRound(Number((deroHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours before refundable)"
						}else if(!deroHTL.code_valid){
							action_button.textContent="Problem with SC"
						}else if(deroHTL.balance_ok&&!deroHTL.deadline_ok){
							action_button.textContent="Refund"
							action_button.addEventListener("click",async function(){
								darken_layer.classList.remove("hidden");
								await refundDero(offer.dscid)
								await refreshBids()
							})
						}else{
							action_button.textContent="Status Complete"
						}
					}
				}
			}else
			if(//--taken offers	
				offer.accepted_dero_address==''&&
				offer.dero_bid_address != connected_dero_account
			){
				getAcceptButton(action_button, offer)				
			}else if(offer.accepted_dero_address==connected_dero_account){
				if(offer.dero_bid_address!=connected_dero_account&&offer.from_to=="pls-dero"&&offer.dscid!="waiting"){
					var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
					await checkDeroHTLCode(2,deroHTL)
					offer.deadline=deroHTL.deadline
				}else if(offer.dero_bid_address!=connected_dero_account&&offer.from_to=="dero-pls"&&offer.pscid!="waiting"){
					var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
					await checkInstalledByteCode(2,plsHTL)
					offer.deadline=plsHTL.deadline
				}
				if(offer.dscid=="waiting"&&offer.from_to=="pls-dero"&&!deroHTL.code_valid){
					action_button.textContent="Install Dero HTL SC"
					await getInstallDeroHTLButton(action_button,offer)
				}else if(offer.dscid!="waiting"&&offer.from_to=="pls-dero"){
					if(!deroHTL.deadline_ok&&!deroHTL.balance_ok&&!deroHTL.hash_ok){			
						action_button.textContent="Fund Dero HTL SC";
						await getFundDeroHTLButton(action_button,offer);
					}else if(deroHTL.deadline_ok&&deroHTL.balance_ok&&deroHTL.hash_ok){
						if(offer.pscid == "waiting"){
							action_button.textContent="Waiting for PLS HTL SCID"
							await getWaitingForPLSSCButton(action_button,offer,deroHTL.deadline)
						}else{
							var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
							await checkInstalledByteCode(1,plsHTL)
							if(plsHTL.deadline_ok&&deroHTL.code_valid){	
								if(plsHTL.balance_ok&&plsHTL.code_valid){
									if(plsHTL.receiver!=connected_evm_account&&connected_evm_account!=""){
										action_button.textContent="Wait for refund, address mismatch"
									}else{
										action_button.textContent = "Withdraw PLS funds From HTL SC"
										getWithdrawPLSButton(action_button,offer)
									}								
								}else{
									action_button.textContent = "Status Complete";
								}
							}else if(!plsHTL.deadline_ok&&!plsHTL.hash_ok){
								action_button.textContent="Waiting for deposit (refundable in "+niceRound(Number((deroHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours)"
							}else if(!plsHTL.deadline_ok&&plsHTL.hash_ok&&!plsHTL.key_ok){
								action_button.textContent="Refund in "+niceRound(Number((deroHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours"
							}else{
								action_button.textContent="Status Complete";
							}
						}
					}else if(!deroHTL.deadline_ok&&deroHTL.balance_ok&&deroHTL.hash_ok){
						var plsHTL=await getPLSHTLDetails(offer.pscid,offer.plsamt)
						await checkInstalledByteCode(1,plsHTL)
						if(offer.pscid=="waiting"||!plsHTL.code_valid||(plsHTL.hash_ok&&!plsHTL.key_ok)){
							action_button.textContent="Refund"			
							action_button.addEventListener("click",function(){
								refundDero(offer.dscid)
							})							
						}else{
							action_button.textContent="Status Complete"
						}						
					}else if(!deroHTL.balance_ok&&deroHTL.hash_ok){
						action_button.textContent="Status Complete"
					}		
				}else				
				if(offer.pscid=="waiting"&&offer.from_to=="dero-pls"&&!plsHTL.code_valid){					
					action_button.textContent="Install PLS HTL SC"
					await getInstallPLSHTLButton(action_button,offer)
				}else if(offer.pscid!="waiting"&&offer.from_to=="dero-pls"){
					let pls_scid=plsHTL.scid
					if(!plsHTL.deadline_ok&&!plsHTL.balance_ok&&!plsHTL.hash_ok){
						action_button.textContent="Fund PLS HTL SC"
						await getFundPLSHTLButton(action_button,offer,pls_scid)
					}else if(plsHTL.deadline_ok&&plsHTL.balance_ok&&plsHTL.hash_ok){
						if(offer.dscid=="waiting"){					
							action_button.textContent="Waiting for Dero HTL SCID"						
							await getWaitingForDeroSCButton(action_button,offer,plsHTL.deadline)
						}else{
							var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
							await checkDeroHTLCode(1,deroHTL)
							if(deroHTL.deadline_ok&&plsHTL.code_valid){
								if(deroHTL.balance_ok&&deroHTL.code_valid&&deroHTL.receiver==connected_dero_account){
									action_button.textContent="Withdraw Dero funds From HTL SC"
									await getWithdrawDeroButton(action_button,offer)				
								}else{
									action_button.textContent="Status Complete"
								}
							}else if(!deroHTL.deadline_ok&&!deroHTL.hash_ok){
								action_button.textContent = "Waiting for deposit (refundable in "+niceRound(Number((plsHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours)"
							}else if(!deroHTL.deadline_ok&&deroHTL.hash_ok&&!deroHTL.key_ok){	
								action_button.textContent="Refund in "+niceRound(Number((plsHTL.deadline-nowInSeconds())/3600).toFixed(1))+" hours"
							}else{
								action_button.textContent="Status Complete"
							}
						}
					}else if(!plsHTL.deadline_ok&&plsHTL.balance_ok&&plsHTL.hash_ok){
						var deroHTL=await getDeroHTLDetails(offer.dscid,offer.deroamt)
						await checkDeroHTLCode(1,deroHTL)
						if(offer.dscid=="waiting"||!deroHTL.code_valid||(deroHTL.hash_ok&&!deroHTL.key_ok)){
							action_button.textContent="Refund"			
							action_button.addEventListener("click",function(){
								refundPLS(offer.pscid)
							})							
						}else{
							action_button.textContent="Status Complete"
						}						
					}else if(!plsHTL.balance_ok&&plsHTL.hash_ok){
						action_button.textContent="Status Complete"
					}
				}
			}
		}
		if(offer.dscid !== "waiting"){
			if(deroHTL){
				if(deroHTL.error){
					action_button.textContent = "Dero RPC Error"
					action_button.disabled = true;
				}
			}
		}		
		if(offer.pscid !== "waiting"){
			if(plsHTL){
				if(plsHTL.error){
					action_button.textContent = "PLS RPC Error"
					action_button.disabled = true;
				}
			} 
		}
		if(!completed_offers.hasOwnProperty(offer.id)){
			let cache=false
			if(action_button.textContent=="Status Complete"){				
				offer.done=true
				cache=true
			}else if(action_button.textContent=="Expired"){
				offer.expired=true
				cache=true
			}else if(action_button.textContent=="Problem with SC"){
				offer.problem=true
				cache=true
			}	
			if(cache){
				completed_offers[offer.id]=offer
				action_button.disabled=true
			}		
		}
		
		if(button_states.hasOwnProperty(offer.id)){
			let prior_text=button_states[offer.id]
			if(prior_text==action_button.innerText){
				action_button.disabled=true;
			}else{
				delete button_states[offer.id]
			}
		}
		
		setStatus(action_button)
		let etype="div"
		let offer_shown=document.createElement(etype)
		offer_shown.textContent=offer_text
		let dero_bid_address=document.createElement(etype)
		dero_bid_address.textContent=offer.dero_bid_address
		let pls_bid_address=document.createElement(etype)
		pls_bid_address.textContent=offer.pls_bid_address
		let accepted_dero_address=document.createElement(etype)
		accepted_dero_address.textContent=offer.accepted_dero_address
		let accepted_pls_address=document.createElement(etype)
		accepted_pls_address.textContent=offer.accepted_pls_address
		let dscid=document.createElement(etype)
		dscid.textContent=offer.dscid		
		let pscid=document.createElement(etype)			
		pscid.textContent=offer.pscid
		let row={
			"id":offer.id,
			"deadline":(offer.deadline == 0?10000000000:offer.deadline),
			"action_button":action_button,
			"offer_shown":offer_shown,
			"dero_bid_address":dero_bid_address,
			"pls_bid_address":pls_bid_address,
			"accepted_dero_address":accepted_dero_address,
			"accepted_pls_address":accepted_pls_address,
			"dscid":dscid,
			"pscid":pscid
		}
		if(!(filters.my_active && (offer.done === true || offer.expired === true || offer.problem === true))){
			rows.push(row)
		}
	}
	showStatus()
	if(latest_first&&(filters.my_active||filters.my_taken)){
		rows.sort(function(a, b){
			return parseFloat(b.deadline)-parseFloat(a.deadline)
		})
	}
	tbody_list.innerHTML="<div><div></div><div>Offer</div><div>Maker Dero Address</div><div>Maker PLS Address</div><div>Taker Dero Address</div><div>Taker PLS Address</div><div>dscid</div><div>pscid</div></div>"
	for(const i in rows){
		const row=document.createElement('div')
		for(let[key, value] of Object.entries(rows[i])){
			if(key!=="id"&key!=="deadline"){
				row.appendChild(value)
			}
		}
		tbody_list.appendChild(row)
	}
	rows=[]
}