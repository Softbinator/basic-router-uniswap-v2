/* Autogenerated file. Do not edit manually. */

/* tslint:disable */

/* eslint-disable */
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import { Contract, ContractFactory, Overrides, Signer, utils } from "ethers";

import type { PromiseOrValue } from "../../common";
import type { Token, TokenInterface } from "../../contracts/Token";

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405162001904380380620019048339818101604052810190620000379190620002c2565b818181600390805190602001906200005192919062000075565b5080600490805190602001906200006a92919062000075565b5050505050620003ab565b828054620000839062000376565b90600052602060002090601f016020900481019282620000a75760008555620000f3565b82601f10620000c257805160ff1916838001178555620000f3565b82800160010185558215620000f3579182015b82811115620000f2578251825591602001919060010190620000d5565b5b50905062000102919062000106565b5090565b5b808211156200012157600081600090555060010162000107565b5090565b6000604051905090565b600080fd5b600080fd5b600080fd5b600080fd5b6000601f19601f8301169050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6200018e8262000143565b810181811067ffffffffffffffff82111715620001b057620001af62000154565b5b80604052505050565b6000620001c562000125565b9050620001d3828262000183565b919050565b600067ffffffffffffffff821115620001f657620001f562000154565b5b620002018262000143565b9050602081019050919050565b60005b838110156200022e57808201518184015260208101905062000211565b838111156200023e576000848401525b50505050565b60006200025b6200025584620001d8565b620001b9565b9050828152602081018484840111156200027a57620002796200013e565b5b620002878482856200020e565b509392505050565b600082601f830112620002a757620002a662000139565b5b8151620002b984826020860162000244565b91505092915050565b60008060408385031215620002dc57620002db6200012f565b5b600083015167ffffffffffffffff811115620002fd57620002fc62000134565b5b6200030b858286016200028f565b925050602083015167ffffffffffffffff8111156200032f576200032e62000134565b5b6200033d858286016200028f565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806200038f57607f821691505b602082108103620003a557620003a462000347565b5b50919050565b61154980620003bb6000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c806340c10f191161007157806340c10f19146101a357806370a08231146101bf57806395d89b41146101ef578063a457c2d71461020d578063a9059cbb1461023d578063dd62ed3e1461026d576100b4565b806306fdde03146100b9578063095ea7b3146100d757806318160ddd1461010757806323b872dd14610125578063313ce567146101555780633950935114610173575b600080fd5b6100c161029d565b6040516100ce9190610d98565b60405180910390f35b6100f160048036038101906100ec9190610e53565b61032f565b6040516100fe9190610eae565b60405180910390f35b61010f610352565b60405161011c9190610ed8565b60405180910390f35b61013f600480360381019061013a9190610ef3565b61035c565b60405161014c9190610eae565b60405180910390f35b61015d61038b565b60405161016a9190610f62565b60405180910390f35b61018d60048036038101906101889190610e53565b610394565b60405161019a9190610eae565b60405180910390f35b6101bd60048036038101906101b89190610e53565b61043e565b005b6101d960048036038101906101d49190610f7d565b61044c565b6040516101e69190610ed8565b60405180910390f35b6101f7610494565b6040516102049190610d98565b60405180910390f35b61022760048036038101906102229190610e53565b610526565b6040516102349190610eae565b60405180910390f35b61025760048036038101906102529190610e53565b610610565b6040516102649190610eae565b60405180910390f35b61028760048036038101906102829190610faa565b610633565b6040516102949190610ed8565b60405180910390f35b6060600380546102ac90611019565b80601f01602080910402602001604051908101604052809291908181526020018280546102d890611019565b80156103255780601f106102fa57610100808354040283529160200191610325565b820191906000526020600020905b81548152906001019060200180831161030857829003601f168201915b5050505050905090565b60008061033a6106ba565b90506103478185856106c2565b600191505092915050565b6000600254905090565b6000806103676106ba565b905061037485828561088b565b61037f858585610917565b60019150509392505050565b60006012905090565b60008061039f6106ba565b9050610433818585600160008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461042e9190611079565b6106c2565b600191505092915050565b6104488282610b96565b5050565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6060600480546104a390611019565b80601f01602080910402602001604051908101604052809291908181526020018280546104cf90611019565b801561051c5780601f106104f15761010080835404028352916020019161051c565b820191906000526020600020905b8154815290600101906020018083116104ff57829003601f168201915b5050505050905090565b6000806105316106ba565b90506000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050838110156105f7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105ee90611141565b60405180910390fd5b61060482868684036106c2565b60019250505092915050565b60008061061b6106ba565b9050610628818585610917565b600191505092915050565b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610731576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610728906111d3565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036107a0576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161079790611265565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258360405161087e9190610ed8565b60405180910390a3505050565b60006108978484610633565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146109115781811015610903576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016108fa906112d1565b60405180910390fd5b61091084848484036106c2565b5b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610986576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161097d90611363565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036109f5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109ec906113f5565b60405180910390fd5b610a00838383610cf5565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610a86576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610a7d90611487565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610b199190611079565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef84604051610b7d9190610ed8565b60405180910390a3610b90848484610cfa565b50505050565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610c05576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bfc906114f3565b60405180910390fd5b610c1160008383610cf5565b8060026000828254610c239190611079565b92505081905550806000808473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206000828254610c789190611079565b925050819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610cdd9190610ed8565b60405180910390a3610cf160008383610cfa565b5050565b505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b83811015610d39578082015181840152602081019050610d1e565b83811115610d48576000848401525b50505050565b6000601f19601f8301169050919050565b6000610d6a82610cff565b610d748185610d0a565b9350610d84818560208601610d1b565b610d8d81610d4e565b840191505092915050565b60006020820190508181036000830152610db28184610d5f565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610dea82610dbf565b9050919050565b610dfa81610ddf565b8114610e0557600080fd5b50565b600081359050610e1781610df1565b92915050565b6000819050919050565b610e3081610e1d565b8114610e3b57600080fd5b50565b600081359050610e4d81610e27565b92915050565b60008060408385031215610e6a57610e69610dba565b5b6000610e7885828601610e08565b9250506020610e8985828601610e3e565b9150509250929050565b60008115159050919050565b610ea881610e93565b82525050565b6000602082019050610ec36000830184610e9f565b92915050565b610ed281610e1d565b82525050565b6000602082019050610eed6000830184610ec9565b92915050565b600080600060608486031215610f0c57610f0b610dba565b5b6000610f1a86828701610e08565b9350506020610f2b86828701610e08565b9250506040610f3c86828701610e3e565b9150509250925092565b600060ff82169050919050565b610f5c81610f46565b82525050565b6000602082019050610f776000830184610f53565b92915050565b600060208284031215610f9357610f92610dba565b5b6000610fa184828501610e08565b91505092915050565b60008060408385031215610fc157610fc0610dba565b5b6000610fcf85828601610e08565b9250506020610fe085828601610e08565b9150509250929050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061103157607f821691505b60208210810361104457611043610fea565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061108482610e1d565b915061108f83610e1d565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156110c4576110c361104a565b5b828201905092915050565b7f45524332303a2064656372656173656420616c6c6f77616e63652062656c6f7760008201527f207a65726f000000000000000000000000000000000000000000000000000000602082015250565b600061112b602583610d0a565b9150611136826110cf565b604082019050919050565b6000602082019050818103600083015261115a8161111e565b9050919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b60006111bd602483610d0a565b91506111c882611161565b604082019050919050565b600060208201905081810360008301526111ec816111b0565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b600061124f602283610d0a565b915061125a826111f3565b604082019050919050565b6000602082019050818103600083015261127e81611242565b9050919050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000600082015250565b60006112bb601d83610d0a565b91506112c682611285565b602082019050919050565b600060208201905081810360008301526112ea816112ae565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b600061134d602583610d0a565b9150611358826112f1565b604082019050919050565b6000602082019050818103600083015261137c81611340565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b60006113df602383610d0a565b91506113ea82611383565b604082019050919050565b6000602082019050818103600083015261140e816113d2565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b6000611471602683610d0a565b915061147c82611415565b604082019050919050565b600060208201905081810360008301526114a081611464565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b60006114dd601f83610d0a565b91506114e8826114a7565b602082019050919050565b6000602082019050818103600083015261150c816114d0565b905091905056fea26469706673582212207a94cb7cace78744159e73f653a45f74bae020e69abcf350ab6c6ee36c50741564736f6c634300080d0033";

type TokenConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (xs: TokenConstructorParams): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Token__factory extends ContractFactory {
  constructor(...args: TokenConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> },
  ): Promise<Token> {
    return super.deploy(_name, _symbol, overrides || {}) as Promise<Token>;
  }
  override getDeployTransaction(
    _name: PromiseOrValue<string>,
    _symbol: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> },
  ): TransactionRequest {
    return super.getDeployTransaction(_name, _symbol, overrides || {});
  }
  override attach(address: string): Token {
    return super.attach(address) as Token;
  }
  override connect(signer: Signer): Token__factory {
    return super.connect(signer) as Token__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): TokenInterface {
    return new utils.Interface(_abi) as TokenInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Token {
    return new Contract(address, _abi, signerOrProvider) as Token;
  }
}