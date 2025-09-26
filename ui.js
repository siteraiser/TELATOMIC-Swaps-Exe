
let latest_block = document.getElementById("latest_block");
let refresh_checkbox = document.getElementById('refresh_checkbox');
let refresh_text = document.getElementById('refresh_text');
let refresh_mode = "topoheight";
refresh_checkbox.addEventListener('click',() => { 
 if(refresh_mode == "topoheight"){
	 refresh_text.innerText = "Using Timer";
	 refresh_mode = "timer";
 }else{
	refresh_text.innerText = "Using Heights";
	refresh_mode = "topoheight";
 }
});
//offers table
let tbody_list = document.getElementById("bid_list");

//--modals--
var modal = document.getElementById("modal");
var confirm_modal = document.getElementById("confirm_modal");
var prompt_modal = document.getElementById("prompt_modal");

var close_buttons = document.querySelectorAll('.close');
var darken_layer = document.querySelector('.darken');


// show / hide modals 
async function alertModal(text){
	return new Promise((resolve, failed)=>{
	modal.innerHTML = "";
	let alert_text = document.createElement("div");
	alert_text.innerHTML = text;		
	modal.appendChild(alert_text);
	
	let ok_button = document.createElement("button");
	ok_button.textContent = "OK";	
	ok_button.addEventListener("click", (event) => {
		event.target.parentElement.classList.add("hidden");		
		darken_layer.classList.add("hidden");
		resolve(true);
	})	
	modal.appendChild(ok_button);	
	modal.classList.remove("hidden");		
	darken_layer.classList.remove("hidden");
	})
}

async function confirmModal(text){ 
	return new Promise((resolve, failed)=>{
	modal.innerHTML = "";
	let confirm_text = document.createElement("div");
	confirm_text.innerHTML = text;		
	modal.appendChild(confirm_text);
	
	let ok_button = document.createElement("button");
	ok_button.textContent = "OK";	
	ok_button.addEventListener("click", (event) => {
		event.target.parentElement.classList.add("hidden");		
		darken_layer.classList.add("hidden");
		resolve(true);
	})	
	let cancel_button = document.createElement("button");
		cancel_button.textContent = "Cancel";	
		cancel_button.addEventListener("click", (event) => {
		event.target.parentElement.classList.add("hidden");		
		darken_layer.classList.add("hidden");
		resolve(false);
	})	
	modal.appendChild(ok_button);
	modal.appendChild(cancel_button);	
	modal.classList.remove("hidden");		
	darken_layer.classList.remove("hidden");
	})
}

async function promptModal(text,input_value="",vars={},callback = null){
	return new Promise((resolve, failed)=>{
		modal.innerHTML = "";
		modal.id = "";
		modal.className = "modal hidden";
		
		let prompt_text = document.createElement("div");
		prompt_text.textContent = text;		
		modal.appendChild(prompt_text);
		
		if(typeof vars.class !== "undefined"){
			modal.classList.add(vars.class);
		}
		
		let ok_button = document.createElement("button");	
		ok_button.textContent = "OK";	
		if(Array.isArray(input_value)){
			let prompt_input_array = [];
			for (index in input_value){
				let prompt_input = document.createElement("input");
				
				prompt_input.type = "text";	
				prompt_input.id=index;
				prompt_input.value = input_value[index];	
						
				modal.appendChild(prompt_input);
				prompt_input_array.push(prompt_input);	
			}
			ok_button.addEventListener("click", (event) => {		
				let prompt_input_values =[];
				for (index in prompt_input_array){
					prompt_input_values.push(document.getElementById(prompt_input_array[index].id).value);
				}
				event.target.parentElement.classList.add("hidden");		
				darken_layer.classList.add("hidden");			
				resolve(prompt_input_values);
			})	
		}else{	
			let prompt_input = document.createElement("input");
			prompt_input.type = "text";	
			prompt_input.value = input_value;		
			modal.appendChild(prompt_input);
			ok_button.addEventListener("click", (event) => {
				event.target.parentElement.classList.add("hidden");		
				darken_layer.classList.add("hidden");
				resolve(prompt_input.value);
			})	
		}
		
		
		let cancel_button = document.createElement("button");
		cancel_button.textContent = "Cancel";	
		cancel_button.addEventListener("click", (event) => {
			event.target.parentElement.classList.add("hidden");		
			darken_layer.classList.add("hidden");
			resolve(null);
		})	
		modal.appendChild(ok_button);
		modal.appendChild(cancel_button);	
		modal.classList.remove("hidden");		
		darken_layer.classList.remove("hidden");
		if(callback!==null){
			callback();
		}
	})
}

	

	
	//hashed time lock contract id
	//switch bids order
	let dero_input = document.getElementById("dero_input");
	let pls_input = document.getElementById("pls_input");
	let dero_bid_amt = document.getElementById("dero_bid_amt");	
	let pls_bid_amt = document.getElementById("pls_bid_amt");	
	let bid_switch = document.getElementById("bid_switch");	

	let bid_switch_mode="dero-pls";
	bid_switch.addEventListener('click', function(event) {
		if(bid_switch_mode == "dero-pls"){
			bid_switch_mode = "pls-dero";
		}else{
			bid_switch_mode = "dero-pls";
		}		
		setBidForm(bid_switch_mode);
    });
	
	function setBidForm(){
		if(bid_switch_mode == "dero-pls"){			
			dero_input.style.order = "1";
			pls_input.style.order = "3";
		}else{
			dero_input.style.order = "3";
			pls_input.style.order = "1";
		}
	}
	

//Bid table display functions
var refreshbidsbutton = document.getElementById('refresh_bids');    
refreshbidsbutton.addEventListener('click', async function(event) {
	await refreshBids();
});	

var bid_filter_buttons = document.querySelectorAll('.bid_filter_buttons button'); 

bid_filter_buttons.forEach((button) => {
	button.addEventListener("click", async (event) => {	
		bid_filter_buttons.forEach((button) => {
			if(event.target.id == button.id){
				button.classList.add("selected");
			}else{
				button.classList.remove("selected");
			}
		});
		setFilter(event.target.id);
		await refreshBids();
	})
});	


let show_d_p = true;
let show_p_d = true;
let d_p_checkbox = document.getElementById('d_p');
d_p_checkbox.addEventListener('click', async (event) => { 
	if(loading){event.preventDefault();return;}
	show_d_p = !show_d_p;  	
	await refreshBids();
});
let p_d_checkbox = document.getElementById('p_d');
p_d_checkbox.addEventListener('click', async (event) => { 
	if(loading){event.preventDefault();return;}
	show_p_d = !show_p_d;  	
	await refreshBids();
});


var filters = {};
filters.all_offers = true;
filters.my_offers = false;
filters.my_active = false;
filters.my_taken = false;

function setFilter(filter){
	for (let [key, value] of Object.entries(filters)) {			
		if(key == filter){
			filters[key] = true;
		}else{	
			filters[key] = false;
		}
	}
}
	

//ordering	
let latest_first = true;
let best_first = false;
let largest_first = false;
let latest_first_checkbox = document.getElementById('latest_first');
latest_first_checkbox.addEventListener('click', async (event) => { 
	if(loading){event.preventDefault();return;}
	deSelect(event.target.id);
	latest_first = !latest_first;  
	await refreshBids();
});

let best_first_checkbox = document.getElementById('best_first');
best_first_checkbox.addEventListener('click', async (event) => { 
	if(loading){event.preventDefault();return;}
	deSelect(event.target.id);
	best_first = !best_first;  
	await refreshBids();
});

let largest_first_checkbox = document.getElementById('largest_first');
largest_first_checkbox.addEventListener('click', async (event) => { 
	if(loading){event.preventDefault();return;}
	deSelect(event.target.id);
	largest_first = !largest_first;  
	await refreshBids();
});

function deSelect(id){
	if(id != "latest_first") {
		latest_first_checkbox.checked = false;
		latest_first = false;
	}
	if(id != "best_first") {
		best_first_checkbox.checked = false;
		best_first = false;
	}
	if(id != "largest_first") {
		largest_first_checkbox.checked = false;
		largest_first = false;
	}	
}


//--------------------------
//--Bidding functions-------
//--------------------------	

//accept bid from button in table	
async function acceptBid(offer){	
	let accepted = false;
	if(offer.from_to =="dero-pls"){
		//accepter must deply sol contract and fund it etc
		accepted = await acceptDeroToPLSOffer(offer);		
	}else if(offer.from_to =="pls-dero"){
		accepted = await acceptPLSToDeroOffer(offer);
	}	
	if(accepted === false){
		delete button_states[offer.id]
	}
}

//-status

const link = document.createElement('link');
link.id = 'icon';
link.rel = 'icon';
link.type = 'image/svg+xml';

const goodtogo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="green" />
</svg>`;
const attention = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="orange" />
</svg>`;
const problem = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="red" />
</svg>`;
let blob = new Blob([goodtogo], { type: 'image/svg+xml' });
const okstatus = URL.createObjectURL(blob);

blob = new Blob([attention], { type: 'image/svg+xml' });
const attentionstatus = URL.createObjectURL(blob);

blob = new Blob([problem], { type: 'image/svg+xml' });
const problemstatus = URL.createObjectURL(blob);

link.href = okstatus;

document.head.appendChild(link);

let icon = document.getElementById('icon');

let action_required=0
function resetStatus(){
	action_required = 0
}
function setStatus(action_button){
	if(
	action_button.innerText.substring(0,4) != "Wait" &
	action_button.innerText.substring(0,9) != "Refund in" &
	!action_button.disabled
	)
	{
		if(action_button.innerText!=="Refund"&&action_button.innerText!=="Accept"&&action_button.innerText!=="Remove"){
			action_required = 1
		}
	}
}
function showStatus(){
	if(!c_status.classList.contains('ok')){
		icon.href = problemstatus;
	}else if(action_required){
		icon.href = attentionstatus;
	}else{
		icon.href = okstatus;
	}

}	