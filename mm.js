const use_chain_id = 369;
const messages = document.querySelector('.messages');
// Account and connection stuff 
const ethereumButton = document.querySelector('.enableEthereumButton');
const showAccount = document.querySelector('.showAccount');
const showChainId = document.querySelector('.showChainId');

var web3;
var connected_evm_account='';


// check if web3 is available
if (typeof window.ethereum !== 'undefined') {
	// use the browser injected Ethereum provider
	web3 = new Web3(window.ethereum);
	setChainId();		
	registerHandlers();
	web3.eth.transactionPollingTimeout = 1000;

} else {
	// if window.ethereum is not available, give instructions to install MetaMask
	messages.innerHTML =
		'Please install MetaMask to connect';
}


ethereumButton.addEventListener('click', async () => {	
	setChainId();
	connectToMetaMask();
});	

async function connectToMetaMask(){
	handleConnectButton("Waiting");
	let error = await requestAccounts();
	if(error === ''){
		messages.innerHTML = "";
		getAccount();			
	}else{
		if (error.code === 4001) {	
			handleConnectButton("Connect");		
			messages.innerHTML = "Please connect to MetaMask.";
		}else if(error.code === -32002){
			messages.innerHTML = "Waiting for sign-in.";
		}		
	}
}

async function requestAccounts() {
	let error ='';
	await window.ethereum.request({ method: 'eth_requestAccounts' })  
	.catch((err) => {		
		error = err;
    });	
	return error;
}


async function getAccount() {
	handleConnectButton("Connect");
	// get list of accounts
	const accounts = await web3.eth.getAccounts();
	if(accounts.length > 0){
		// show the first account
		if(connected_evm_account != "" && connected_evm_account != accounts[0]){
			completed_offers=[]
			web3contracts=[]
		}
		connected_evm_account = accounts[0];	
		showAccount.innerHTML = connected_evm_account;
		handleConnectButton();	
	}
}

var chain_selected = 0;	
let chains = [];
function displayChainInfo(chainId){
	chain_selected = web3.utils.hexToNumberString(chainId);
	chains[369] = 'pls';
	chains[943] = 'plsV4testnet';
	chains[1] = 'eth';
	showChainId.innerHTML = chain_selected + "-"+ chains[chain_selected];
}

async function setChainId(){
	var chainId = await window.ethereum.request({ method: 'eth_chainId' });
	displayChainInfo(chainId);	
}

function handleConnectButton(text=""){
	if(text != ""){ 
		ethereumButton.innerHTML = text;	
	}else if(window.ethereum.isConnected()){
		ethereumButton.innerHTML = "Connected";	
		ethereumButton.style.color = "green";
		CStatusChange();
	}else{
		ethereumButton.innerHTML = "Connect";	
		CStatusChange();
	}
}

function registerHandlers(){
	window.ethereum.on('chainChanged', displayChainInfo);
	window.ethereum.on("accountsChanged", getAccount);
	window.ethereum.on("disconnect", handleConnectButton);
}


//Check / update this before deployment
async function connectionOK(){	
	if(chain_selected == use_chain_id && connected_evm_account != ""){
		return true;
	}
	await alertModal("MetaMask Wallet connection required. Make sure you are connected to "+chains[use_chain_id]+" (chain id "+use_chain_id+")");
	return false;
}


const HTLContractABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_receiver_address",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "deadline",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "deposited",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "hash",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "key",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "receiver",
		"outputs": [
			{
				"internalType": "address payable",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "refund",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "_hash",
				"type": "bytes32"
			}
		],
		"name": "startSwap",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_key",
				"type": "string"
			}
		],
		"name": "withdraw",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	}
];

function getInstallByteCode(days){
	let insert_1;
	let insert_2;
	if (days === 1){		
		return pls1daycontract;
	}else if(days === 2){		
		return pls2daycontract;
	}else{
		return false;
	}
}

