import { default as MyERC20TokenArtifact } from './MyERC20Token.json';
import { default as SupplyChainArtifact } from './SupplyChain.json';

export const MyERC20Token_ABI = MyERC20TokenArtifact.abi;
export const MyERC20Token_ADDRESS = MyERC20TokenArtifact.networks[Object.keys(MyERC20TokenArtifact.networks)[0]].address;

export const SupplyChain_ABI = SupplyChainArtifact.abi;
export const SupplyChain_ADDRESS = SupplyChainArtifact.networks[Object.keys(SupplyChainArtifact.networks)[0]].address;