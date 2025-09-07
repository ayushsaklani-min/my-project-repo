// src/App.js

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './App.css';
import UniswapV2Router02ABI from './abis/UniswapV2Router02.json';

// --- IMPORTANT: PASTE YOUR GOOGLE AI API KEY HERE ---
const API_KEY = "AIzaSyDPcdJpZ2S7yjyXD1Dmr_jXmkcvgvV7YMc"; // IMPORTANT: Replace this with your actual key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- TOKEN AND UNISWAP CONFIGURATION (SEPOLIA TESTNET) ---
const UNISWAP_ROUTER_ADDRESS = '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';

const TOKENS = {
  ETH: {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    symbol: 'ETH',
    decimals: 18,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'
  },
  WETH: {
    address: '0x7b79995e5f793a07bc00c21412e50eaae098e7f9', // CORRECTED: all lowercase
    symbol: 'WETH',
    decimals: 18,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png'
  },
  DAI: {
    address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
    symbol: 'DAI',
    decimals: 18,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png'
  },
  USDC: {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a90',
    symbol: 'USDC',
    decimals: 6,
    logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png'
  }
};

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [portfolio, setPortfolio] = useState({});
  const [userInput, setUserInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('DAI');
  const [fromAmount, setFromAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);

  const fromTokenBalance = portfolio[fromToken] ? parseFloat(portfolio[fromToken]).toFixed(4) : '0.00';

  async function connectWallet() {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const sepoliaChainId = 11155111;
        const network = await provider.getNetwork();
        
        if (network.chainId !== sepoliaChainId) {
            setMessage(`Please switch your wallet to the Sepolia Testnet.`);
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${sepoliaChainId.toString(16)}` }],
                });
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                const signer = await newProvider.getSigner();
                const account = await signer.getAddress();
                setWalletAddress(account);
                fetchAllBalances(newProvider, account);
                return;
            } catch (switchError) {
                setMessage("Failed to switch network. Please do it manually in MetaMask.");
                return;
            }
        }
        
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        setWalletAddress(account);
        fetchAllBalances(provider, account);
      } catch (error) {
        console.error("Error connecting:", error);
        setMessage("Error connecting to wallet.");
      }
    } else {
      setMessage('Please install MetaMask!');
    }
  }

  async function fetchAllBalances(provider, account) {
    setMessage("Fetching token balances...");
    const portfolioData = {};
    for (const tokenSymbol in TOKENS) {
        const token = TOKENS[tokenSymbol];
        try {
            let balanceWei;
            if (token.symbol === 'ETH') {
                balanceWei = await provider.getBalance(account);
            } else {
                const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
                balanceWei = await tokenContract.balanceOf(account);
            }
            portfolioData[tokenSymbol] = ethers.formatUnits(balanceWei, token.decimals);
        } catch (error) {
            console.error(`Could not fetch balance for ${tokenSymbol}`, error);
            portfolioData[tokenSymbol] = "0";
        }
    }
    setPortfolio(portfolioData);
    setMessage("");
  }

  async function handleSwap() {
    if (!fromAmount || isNaN(fromAmount) || Number(fromAmount) <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }
    setIsTrading(true);
    setMessage('');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const routerContract = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UniswapV2Router02ABI, signer);
      const fromTokenInfo = TOKENS[fromToken];
      const amountIn = ethers.parseUnits(fromAmount, fromTokenInfo.decimals);
      const path = [
          fromToken === 'ETH' ? TOKENS.WETH.address : fromTokenInfo.address,
          toToken === 'ETH' ? TOKENS.WETH.address : TOKENS[toToken].address
      ];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 15;
      setMessage("Confirm transaction in wallet...");
      let tx;
      if (fromToken === 'ETH') {
          tx = await routerContract.swapExactETHForTokens(0, path, walletAddress, deadline, { value: amountIn });
      } else {
          // ERC20 -> ETH or ERC20 -> ERC20 requires approval first.
          setMessage("Swapping from tokens is not supported in this example.");
          setIsTrading(false);
          return;
      }
      await tx.wait();
      setMessage("Swap successful!");
      fetchAllBalances(provider, walletAddress);
    } catch (error) {
      console.error("Swap failed:", error);
      setMessage(`Swap failed: ${error.reason || "Check console."}`);
    } finally {
      setIsTrading(false);
      setFromAmount("");
      setTimeout(() => setMessage(''), 5000);
    }
  }

async function handleAskAI() {
    if (!userInput.trim()) {
        setMessage("Please type a question for the AI.");
        return;
    }
    if (Object.keys(portfolio).length === 0) {
        setMessage("Please connect your wallet first so I can see your portfolio.");
        return;
    }
    if (!API_KEY || API_KEY === "YOUR_GOOGLE_AI_API_KEY_HERE") {
      setMessage("Please add your Google AI API Key to the App.js file.");
      return;
    }

    setIsLoading(true);
    setAiResponse("");
    setMessage(""); // Clear any previous messages

    // THIS LINE IS NOW CORRECTED
    const portfolioString = Object.entries(portfolio).map(([symbol, balance]) => `${symbol}: ${parseFloat(balance).toFixed(4)}`).join(', ');
    
    const prompt = `You are a helpful crypto trading assistant named Aya. The user's wallet portfolio contains: ${portfolioString}. The user's question is: "${userInput}". Based on their portfolio, answer the question in a friendly and simple way. Do not give financial advice.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text(); 
      setAiResponse(text);
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Sorry, there was an error getting a response. Please check your API key and the console.");
    } finally {
      setIsLoading(false);
    }
  }

  const renderTokenDropdown = (value, onChange) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="token-select">
      {Object.keys(TOKENS).map(tokenSymbol => (<option key={tokenSymbol} value={tokenSymbol}>{tokenSymbol}</option>))}
    </select>
  );

  return (
    <div className="App">
      <header className="App-header">
        <img src="data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%2361dafb;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%239261fb;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M 50 10 L 10 90 H 30 L 50 40 L 70 90 H 90 L 50 10 Z' fill='url(%23grad1)' /%3e%3cpath d='M 40 60 H 60 L 50 80 Z' fill='url(%23grad1)' /%3e%3c/svg%3e" alt="AYA Logo" style={{width: '80px', marginBottom: '20px', borderRadius: '50%'}} />
        <h1>AYA AI Trading Assistant</h1>

        {!walletAddress && (<button onClick={connectWallet} className="connect-wallet-btn">Connect Wallet</button>)}
        {message && <p className="message-box">{message}</p>}

        {walletAddress && (
          <div className="container">
            <div className="left-column">
              <div className="wallet-info card">
                <h3>Wallet Overview</h3>
                <p><strong>Address:</strong> {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                <div className="portfolio-grid">
                  {Object.entries(portfolio).map(([symbol, balance]) => (
                    <div className="portfolio-item" key={symbol}>
                      <img src={TOKENS[symbol]?.logo} alt={symbol} />
                      <div>
                        <span className="token-symbol">{symbol}</span>
                        <span className="token-balance">{parseFloat(balance).toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ai-section card">
                <h3>Ask Aya Anything!</h3>
                <div className="ai-input-wrapper">
                  <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="e.g., What are my top holdings?"/>
                  <button onClick={handleAskAI} disabled={isLoading}>{isLoading ? 'Thinking...' : 'Ask'}</button>
                </div>
                {aiResponse && (<div className="ai-response"><p><strong>Aya says:</strong> {aiResponse}</p></div>)}
              </div>
            </div>

            <div className="right-column">
              <div className="trading-section card">
                <h3>Swap Tokens</h3>
                <small>Balance: {fromTokenBalance} {fromToken}</small>
                <div className="token-input-container">
                  <input type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="token-input"/>
                  <div className="token-label">
                    <img src={TOKENS[fromToken]?.logo} alt={fromToken} />
                    {renderTokenDropdown(fromToken, setFromToken)}
                  </div>
                </div>
                <p className="arrow-down">↓</p>
                <div className="token-input-container">
                  <input type="number" placeholder="0.0" disabled className="token-input"/>
                  <div className="token-label">
                    <img src={TOKENS[toToken]?.logo} alt={toToken} />
                    {renderTokenDropdown(toToken, setToToken)}
                  </div>
                </div>
                <button onClick={handleSwap} disabled={isTrading || !fromAmount} className="swap-button">{isTrading ? 'Executing...' : 'Swap'}</button>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;




