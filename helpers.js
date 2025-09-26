//functions

function randomString(length) {
  let array = new Uint8Array(length);
  array = crypto.getRandomValues(array);
  return Array.from(array, (byte) => String.fromCharCode(33 + (byte % 94))).join('');  
}
function hexToUtf8(s){
    return decodeURIComponent(
        s.replace(/\s+/g, '') // remove spaces
        .replace(/[0-9a-f]{2}/g, '%$&') // add '%' before each 2 characters
    );
} 

function nowInSeconds(){
	return(Math.floor(Date.now() / 1000));
}

function niceRound(number){
	return Math.round(number*100000000)/100000000;
}

function getByteLength(str) {
  return new Blob([str]).size;
}
	
function createMakerDownloadLink(id,deroscid,plscid){

let link = document.createElement("a")
link.download = 'telatomic-contract-ids-'+id+'.txt'
link.innerHTML = "Download"
let download = "swapid:" + id + " deroscid:" +deroscid+ " plsscid:" + plscid;
let blob = new Blob([download], { type: 'text/plain' });
link.href = URL.createObjectURL(blob);
 
return link;
}

function createDownloadLink(id,key,scid){

let link = document.createElement("a")
link.download = 'telatomic-swap-receipt-'+id+'.txt'
link.innerHTML = "Download"
let download = "id:" + id + " key:" +key+ " scid:" + scid;
let blob = new Blob([download], { type: 'text/plain' });
link.href = URL.createObjectURL(blob);
 
return link;
}


dero_input.addEventListener('input', validateAmount, false);
dero_input.addEventListener('keyup', validateAmount, false);
dero_input.addEventListener('focusout', validateAmount, false);		

pls_input.addEventListener('input', validateAmount, false);
pls_input.addEventListener('keyup', validateAmount, false);
pls_input.addEventListener('focusout', validateAmount, false);	

	
function validateAmount(type){
	
	let decimals = 5;
	let togranular = 100000;
	let tonormal = .00001;
	if(event.target.id =="pls_bid_amt"){
		decimals = 0;
		togranular = 1;
		tonormal = 1;
	}
	
	let amount = event.target.value;
	
	amount = amount.replace(/[^0-9\.]/gi, ''); 

	if(amount == ".."){
		amount = ".";
		//return;
	}

	//returns "" or a fixed result (.00000)
	let new_amt_str = "";
	amount = (amount).toString()
	if (amount.length > 1) {
		let chars = amount.split(".");
		
		if(amount.indexOf('.') != -1){
			slice_end = chars[1].length;
			
			if(slice_end > decimals){
				slice_end = decimals;
			}
			new_amt_str = chars[0] + "." + chars[1].slice(0,slice_end);
		}
	}
	
	
	if (new_amt_str != "") {
		amount = new_amt_str;
	}		
	event.target.value =amount;

}
function convertToAtomicUnits(amount){		
	deri = parseFloat(amount);
	deri = 100000 * deri;
	return parseInt(deri);
}
function convertToDeroUnits(amount) {
	if (amount == 0) {
		return "0"
	}
	dero = amount * .00001;
	s = dero.toFixed(5);
	return rtrim(rtrim(s, "0"),".");
}	


function fromPLSAtomicUnits(amount) {
	return amount.toString().slice(0, -18);// * .00000000000000001;
}

function toPLSAtomicUnits(amount) {
	return amount + "000000000000000000" ;// * 100000000000000000;
}

function rtrim(str, ch){
	let i = str.length;
	while (i-- && str.charAt(i) === ch);
	return str.substring(0, i + 1);
}

function filterOffers(offer,offers){	
	
	offer.dratio = parseFloat(offer.deroamt) / parseFloat(offer.plsamt);
	offer.pratio = parseFloat(offer.plsamt) / parseFloat(offer.deroamt);	

	if(show_p_d && offer.from_to == "pls-dero" || show_d_p && offer.from_to == "dero-pls" ){			
	
		//filtering
		if(filters.all_offers){
			if(offer.accepted_dero_address == ""){
				offers.push(offer);
			} 
		}else if(filters.my_offers){
			if(offer.dero_bid_address == connected_dero_account){
				offers.push(offer);
			}
		}else if(filters.my_taken){
			if(
			offer.accepted_dero_address == connected_dero_account				
			){
				offers.push(offer);
			} 
		}else if(filters.my_active){
			if(offer.dero_bid_address == connected_dero_account || 
			offer.accepted_dero_address == connected_dero_account
			){
				offers.push(offer);
			} 
		}		
	}
	
}

	
function sortOffers(offers){	
	if(latest_first){
		offers.sort(function(a, b) {
			return parseFloat(b.id) - parseFloat(a.id);
		});
	}

	//ordering
	if(best_first && offers.length !== 0){
		let minp = offers.reduce(function(prev, current) {
		  return (prev && prev.pratio < current.pratio) ? prev : current
		})			
		let maxp = offers.reduce(function(prev, current) {
		  return (prev && prev.pratio > current.pratio) ? prev : current
		})
		
		let mind = offers.reduce(function(prev, current) {
		  return (prev && prev.dratio < current.dratio) ? prev : current
		})
		let maxd = offers.reduce(function(prev, current) {
		  return (prev && prev.dratio > current.dratio) ? prev : current
		})

		let deltap = maxp.pratio - minp.pratio;
		let deltad = maxd.dratio - mind.dratio;			

		for (let i in offers) {
			if(offers[i].from_to == "pls-dero"){
				offers[i].dealRating =  1 - ((deltap / offers[i].pratio)*.01);
			}else{
				offers[i].dealRating =  1 - ((deltad / offers[i].dratio)*.01);
			}
		}	

		offers.sort(function(a, b) {
			return parseFloat(b.dealRating) - parseFloat(a.dealRating);
		});

		
	}


	if(largest_first && offers.length !== 0){
		let minp = offers.reduce(function(prev, current) {
		  return (prev && prev.plsamt < current.plsamt) ? prev : current
		})			
		let maxp = offers.reduce(function(prev, current) {
		  return (prev && prev.plsamt > current.plsamt) ? prev : current
		})
		
		let mind = offers.reduce(function(prev, current) {
		  return (prev && prev.deroamt < current.deroamt) ? prev : current
		})
		let maxd = offers.reduce(function(prev, current) {
		  return (prev && prev.deroamt > current.deroamt) ? prev : current
		})

		let deltap = maxp.plsamt - minp.plsamt;
		let deltad = maxd.deroamt - mind.deroamt;			

		for (let i in offers) {
			if(offers[i].from_to == "pls-dero"){
				offers[i].size =  1 - (deltap / offers[i].plsamt);
			}else{
				offers[i].size =  1 - (deltad / offers[i].deroamt);
			}
		}	
		offers.sort(function(a, b) {
			return parseFloat(b.size) - parseFloat(a.size);
		});
		
	}


}	

