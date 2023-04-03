// import logo from './logo.svg';
import "./App.css";
import SupplyChain from "./build/SupplyChain.json";
import Web3 from "web3";
import { useEffect, useState } from "react";
const supplychainABI = SupplyChain.abi;

// function App() {
//   const web3 = new Web3('http://localhost:7545');

//   const [contract0, setContract0] = useState(null);
//   const [bal, setBal] = useState(0);

//   const connect = async () => {
//     const networkId = await web3.eth.net.getId();
//     const deployedNetwork = SupplyChain.networks[networkId];
//     const contractInstance = new web3.eth.Contract(
//       SupplyChain.abi,
//       deployedNetwork && deployedNetwork.address,
//     );
//     console.log('tjfsdjlf jlsd');
//     setContract0(contractInstance);
//   };
//   const getBal = async () => {
//     const contractBalance = await web3.eth.getBalance(contract0.options.address);
//     setBal(web3.utils.fromWei(contractBalance));
//   };
//   const getOwner = async () => {
//     const contractBalance = await web3.eth.owner();
//     console.log(contractBalance);
//     setBal(web3.utils.fromWei(contractBalance));
//   };
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <button onClick={connect}>Connect to Contract</button>
//         {contract0 && (
//         <button onClick={getOwner}>Get Owner</button>
//         )}
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

const App = () => {
  const [products, setProducts] = useState([]);
  const [adminAaddr, setAdminAaddr] = useState("");
  let web3;
  let deployedNetwork;
  useEffect(() => {
    const loadProducts = async () => {
      // create a new web3 instance using the provider of your choice
      web3 = new Web3("http://localhost:7545");

      // get the network ID of the current network
      const networkId = await web3.eth.net.getId();

      // get the contract instance by network ID and address
      deployedNetwork = SupplyChain.networks[networkId];
      const supplyChain = new web3.eth.Contract(
        SupplyChain.abi,
        deployedNetwork && deployedNetwork.address
      );

      // call the getProducts function of the contract
      // const products = await supplyChain.methods.getProducts().call();
      console.log(products);
      // set the state with the returned products
      setProducts(products);
    };

    loadProducts();
  }, []);

  async function addAdmin(address) {
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    const contract = new web3.eth.Contract(
      supplychainABI,
      deployedNetwork && deployedNetwork.address
    );
    const result = await contract.methods
      .addAdmin(accounts[1])
      .send({ from: accounts[0] });
    setAdminAaddr(result.blockHash);
    console.log(result);
  }

  return (
    <div>
      <h1>Products</h1>
      <button onClick={addAdmin}>Get Admin:{adminAaddr}</button>
      {products.map((product, index) => (
        <div key={index}>
          <h3>{product.name}</h3>
          <p>Price: {product.price}</p>
          <p>Quantity: {product.quantity}</p>
          <p>Retailer: {product.retailer}</p>
        </div>
      ))}
    </div>
  );
};

export default App;
