import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { GoogleGenerativeAI } from '@google/generative-ai';
import '../App.css';
import UniswapV2Router02ABI from '../abis/UniswapV2Router02.json';

// --- SECURE: API KEY FROM ENVIRONMENT VARIABLES ---
const API_KEY = process.env.REACT_APP_GOOGLE_AI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- TOKEN AND UNISWAP CONFIGURATION (SEPOLIA TESTNET) ---
const UNISWAP_ROUTER_ADDRESS = process.env.REACT_APP_UNISWAP_ROUTER_ADDRESS || '0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008';

const TOKENS = {
    ETH: { address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', symbol: 'ETH', decimals: 18, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    WETH: { address: '0x7b79995e5f793a07bc00c21412e50eaae098e7f9', symbol: 'WETH', decimals: 18, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    DAI: { address: '0x68194a729C2450ad26072b3D33ADaCbcef39D574', symbol: 'DAI', decimals: 18, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/4943.png' },
    USDC: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7a90', symbol: 'USDC', decimals: 6, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png' }
};

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];

// --- Mock prices for simulation ---
const MOCK_PRICES = { ETH: 3000, WETH: 3000, DAI: 1, USDC: 1 };


function Dashboard() {
    const [walletAddress, setWalletAddress] = useState("");
    const [provider, setProvider] = useState(null);
    const [portfolio, setPortfolio] = useState({});
    const [userInput, setUserInput] = useState("");
    const [aiResponse, setAiResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Trading State
    const [fromToken, setFromToken] = useState('ETH');
    const [toToken, setToToken] = useState('DAI');
    const [fromAmount, setFromAmount] = useState("");
    const [toAmount, setToAmount] = useState("");
    const [isTrading, setIsTrading] = useState(false);
    const [isQuoteLoading, setIsQuoteLoading] = useState(false);
    const [slippage, setSlippage] = useState("0.5");
    const [isMockQuote, setIsMockQuote] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [portfolioValue, setPortfolioValue] = useState(0);

    const fromTokenBalance = portfolio[fromToken] ? parseFloat(portfolio[fromToken]).toFixed(4) : '0.00';

    useEffect(() => {
        if (fromAmount && !isNaN(fromAmount) && Number(fromAmount) > 0 && provider) {
            const getQuote = async () => {
                setIsQuoteLoading(true);
                setIsMockQuote(false);
                setToAmount("");
                try {
                    const routerContract = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UniswapV2Router02ABI, provider);
                    const fromTokenInfo = TOKENS[fromToken];
                    const toTokenInfo = TOKENS[toToken];
                    const amountIn = ethers.parseUnits(fromAmount, fromTokenInfo.decimals);
                    const path = [
                        fromToken === 'ETH' ? TOKENS.WETH.address : fromTokenInfo.address,
                        toToken === 'ETH' ? TOKENS.WETH.address : toTokenInfo.address
                    ];
                    const amountsOut = await routerContract.getAmountsOut(amountIn, path);
                    const amountOut = ethers.formatUnits(amountsOut[1], toTokenInfo.decimals);
                    setToAmount(amountOut);
                } catch (error) {
                    console.warn("Could not fetch real quote, falling back to simulation.");
                    const simulatedAmount = (parseFloat(fromAmount) * MOCK_PRICES[fromToken]) / MOCK_PRICES[toToken];
                    setToAmount(simulatedAmount.toString());
                    setIsMockQuote(true);
                } finally {
                    setIsQuoteLoading(false);
                }
            };
            const debounce = setTimeout(() => { getQuote(); }, 500);
            return () => clearTimeout(debounce);
        } else {
            setToAmount("");
        }
    }, [fromAmount, fromToken, toToken, provider]);

    async function connectWallet() {
        if (window.ethereum) {
            try {
                const browserProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(browserProvider);
                const sepoliaChainId = 11155111;
                const network = await browserProvider.getNetwork();
                if (network.chainId !== sepoliaChainId) {
                    setMessage(`Please switch your wallet to the Sepolia Testnet.`);
                    try {
                        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${sepoliaChainId.toString(16)}` }] });
                        const newProvider = new ethers.BrowserProvider(window.ethereum);
                        setProvider(newProvider);
                        const signer = await newProvider.getSigner();
                        const account = await signer.getAddress();
                        setWalletAddress(account);
                        fetchAllBalances(newProvider, account);
                    } catch (switchError) {
                        setMessage("Failed to switch network. Please do it manually in MetaMask.");
                    }
                    return;
                }
                const signer = await browserProvider.getSigner();
                const account = await signer.getAddress();
                setWalletAddress(account);
                fetchAllBalances(browserProvider, account);
            } catch (error) {
                console.error("Error connecting:", error);
                setMessage("Error connecting to wallet.");
            }
        } else {
            setMessage('Please install MetaMask!');
        }
    }

    async function fetchAllBalances(currentProvider, account) {
        setMessage("Fetching token balances...");
        const portfolioData = {};
        let totalValue = 0;

        for (const tokenSymbol in TOKENS) {
            const token = TOKENS[tokenSymbol];
            try {
                let balanceWei;
                if (token.symbol === 'ETH') {
                    balanceWei = await currentProvider.getBalance(account);
                } else {
                    const tokenContract = new ethers.Contract(token.address, ERC20_ABI, currentProvider);
                    balanceWei = await tokenContract.balanceOf(account);
                }
                const balance = ethers.formatUnits(balanceWei, token.decimals);
                portfolioData[tokenSymbol] = balance;

                // Calculate portfolio value
                const tokenValue = parseFloat(balance) * MOCK_PRICES[tokenSymbol];
                totalValue += tokenValue;
            } catch (error) {
                console.error(`Could not fetch balance for ${tokenSymbol}`, error);
                portfolioData[tokenSymbol] = "0";
            }
        }
        setPortfolio(portfolioData);
        setPortfolioValue(totalValue);
        setMessage("");
    }

    async function handleSwap() {
        // Enhanced input validation
        const amount = parseFloat(fromAmount);
        if (!fromAmount || !toAmount || toAmount === "N/A" || isNaN(amount) || amount <= 0 || amount > 1000000) {
            setMessage("Please enter a valid amount between 0 and 1,000,000.");
            return;
        }
        if (fromToken === toToken) {
            setMessage("Cannot swap a token for itself.");
            return;
        }

        // Check if user has sufficient balance
        const userBalance = parseFloat(portfolio[fromToken] || 0);
        if (amount > userBalance) {
            setMessage(`Insufficient ${fromToken} balance. You have ${userBalance.toFixed(4)} ${fromToken}.`);
            return;
        }
        setIsTrading(true);
        setMessage('');
        try {
            const signer = await provider.getSigner();
            const routerContract = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UniswapV2Router02ABI, signer);
            const fromTokenInfo = TOKENS[fromToken];
            const toTokenInfo = TOKENS[toToken];
            const amountIn = ethers.parseUnits(fromAmount, fromTokenInfo.decimals);
            const amountOut = ethers.parseUnits(toAmount, toTokenInfo.decimals);
            const slippageTolerance = (Number(slippage) / 100);
            // eslint-disable-next-line no-undef
            const amountOutMin = amountOut - (amountOut * BigInt(Math.floor(slippageTolerance * 10000))) / 10000n;
            const path = [
                fromToken === 'ETH' ? TOKENS.WETH.address : fromTokenInfo.address,
                toToken === 'ETH' ? TOKENS.WETH.address : TOKENS[toToken].address
            ];
            const deadline = Math.floor(Date.now() / 1000) + 60 * 15;
            setMessage("Confirm transaction in wallet...");
            let tx;
            if (fromToken === 'ETH') {
                tx = await routerContract.swapExactETHForTokens(amountOutMin, path, walletAddress, deadline, { value: amountIn });
            } else {
                setMessage("Swapping from ERC20 tokens requires an 'approve' step. Please swap from ETH.");
                setIsTrading(false);
                return;
            }
            await tx.wait();

            // Add to transaction history
            const newTransaction = {
                id: Date.now(),
                type: 'swap',
                fromToken,
                toToken,
                fromAmount,
                toAmount,
                timestamp: new Date().toLocaleString(),
                txHash: tx.hash
            };
            setTransactionHistory(prev => [newTransaction, ...prev.slice(0, 9)]); // Keep last 10 transactions

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

    // Input sanitization function
    const sanitizeInput = (input) => {
        return input.replace(/[<>]/g, '').trim().substring(0, 500); // Remove potential XSS chars and limit length
    };

    // Format currency values
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // Calculate percentage of portfolio
    const getPortfolioPercentage = (tokenSymbol) => {
        if (portfolioValue === 0) return 0;
        const tokenValue = parseFloat(portfolio[tokenSymbol] || 0) * MOCK_PRICES[tokenSymbol];
        return ((tokenValue / portfolioValue) * 100).toFixed(1);
    };

    // Get portfolio diversity score
    const getDiversityScore = () => {
        const nonZeroBalances = Object.entries(portfolio).filter(([, balance]) => parseFloat(balance) > 0);
        if (nonZeroBalances.length <= 1) return "Low";
        if (nonZeroBalances.length === 2) return "Medium";
        return "High";
    };

    async function handleAskAI() {
        if (Object.keys(portfolio).length === 0) {
            setMessage("Please connect your wallet first so I can see your portfolio.");
            return;
        }
        if (!API_KEY) {
            setMessage("Please add your Google AI API Key to the .env file as REACT_APP_GOOGLE_AI_API_KEY.");
            return;
        }

        // Sanitize user input
        const sanitizedInput = sanitizeInput(userInput);
        if (sanitizedInput.length === 0) {
            setMessage("Please enter a valid question.");
            return;
        }

        setIsLoading(true);
        setAiResponse("");
        setMessage("");

        const portfolioString = Object.entries(portfolio)
            .map(([symbol, balance]) => `${symbol}: ${parseFloat(balance).toFixed(4)}`)
            .join(', ');

        // --- Enhanced, proactive AI prompt with sanitized input ---
        const userQuery = sanitizedInput;
        const prompt = `
        You are a helpful crypto trading assistant named Aya. 
        The user's wallet portfolio contains: ${portfolioString}.
        The user's question is: "${userQuery || 'Can you analyze my portfolio?'}"

        Analyze the user's portfolio and provide a helpful, concise insight. 
        1. Identify their largest holding in terms of approximate USD value (use these prices: ETH/WETH=$3000, DAI/USDC=$1).
        2. If they have a significant holding in a volatile asset like ETH, suggest a hypothetical diversification strategy, like swapping a small portion for a stablecoin (DAI or USDC) to hedge against volatility.
        3. If their portfolio is already diversified, compliment them on their strategy.
        4. If the user asks a specific question, answer it based on their portfolio.
        5. IMPORTANT: Do NOT give financial advice. Use words like "you could consider" or "one common strategy is". Keep your tone friendly and encouraging.
    `;

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

    const renderTokenDropdown = (value, onChange, otherToken) => (
        <select value={value} onChange={e => onChange(e.target.value)} className="token-select">
            {Object.keys(TOKENS).filter(tokenSymbol => tokenSymbol !== otherToken).map(tokenSymbol => (<option key={tokenSymbol} value={tokenSymbol}>{tokenSymbol}</option>))}
        </select>
    );

    const getQuoteDisplay = () => {
        if (isQuoteLoading) return "Fetching...";
        if (toAmount === "N/A") return "No quote available";
        if (toAmount) {
            const formattedAmount = `~ ${parseFloat(toAmount).toFixed(6)}`;
            return isMockQuote ? `${formattedAmount} (Simulated)` : formattedAmount;
        }
        return "0.0";
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="header-content">
                    <img src="data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3clinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3e%3cstop offset='0%25' style='stop-color:%236366f1;stop-opacity:1' /%3e%3cstop offset='100%25' style='stop-color:%23ec4899;stop-opacity:1' /%3e%3c/linearGradient%3e%3c/defs%3e%3cpath d='M 50 10 L 10 90 H 30 L 50 40 L 70 90 H 90 L 50 10 Z' fill='url(%23grad1)' /%3e%3cpath d='M 40 60 H 60 L 50 80 Z' fill='url(%23grad1)' /%3e%3c/svg%3e" alt="AYA Logo" className="app-logo" />
                    <h1>AYA AI Trading Assistant</h1>
                </div>

                {!walletAddress && (
                    <div className="connect-container">
                        <p className="welcome-text">Connect your wallet to analyze your portfolio and swap tokens.</p>
                        <button onClick={connectWallet} className="connect-wallet-btn">Connect Wallet</button>
                    </div>
                )}
                {message && <p className="message-box">{message}</p>}

                {walletAddress && (
                    <div className="container">
                        <div className="left-column">
                            <div className="wallet-info card">
                                <h3>Wallet Overview</h3>
                                <p><strong>Address:</strong> {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}</p>
                                <div className="portfolio-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Value:</span>
                                        <span className="stat-value">{formatCurrency(portfolioValue)}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Diversity:</span>
                                        <span className="stat-value">{getDiversityScore()}</span>
                                    </div>
                                </div>
                                <div className="portfolio-grid">
                                    {Object.entries(portfolio).map(([symbol, balance]) => {
                                        const tokenValue = parseFloat(balance) * MOCK_PRICES[symbol];
                                        const percentage = getPortfolioPercentage(symbol);
                                        return (
                                            <div className="portfolio-item" key={symbol}>
                                                <img src={TOKENS[symbol]?.logo} alt={symbol} />
                                                <div>
                                                    <span className="token-symbol">{symbol}</span>
                                                    <span className="token-balance">{parseFloat(balance).toFixed(4)}</span>
                                                    <span className="token-value">{formatCurrency(tokenValue)} ({percentage}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className="history-toggle-btn"
                                    style={{ marginTop: '10px', padding: '8px 16px', fontSize: '14px' }}
                                >
                                    {showHistory ? 'Hide' : 'Show'} Transaction History
                                </button>
                                {showHistory && (
                                    <div className="transaction-history">
                                        <h4>Recent Transactions</h4>
                                        {transactionHistory.length === 0 ? (
                                            <p>No transactions yet</p>
                                        ) : (
                                            transactionHistory.map(tx => (
                                                <div key={tx.id} className="transaction-item">
                                                    <div className="tx-details">
                                                        <span>{tx.fromAmount} {tx.fromToken} → {parseFloat(tx.toAmount).toFixed(4)} {tx.toToken}</span>
                                                        <small>{tx.timestamp}</small>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="ai-section card">
                                <h3>Ask Aya Anything!</h3>
                                <div className="ai-input-wrapper">
                                    <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="e.g., Analyze my portfolio" />
                                    <button onClick={handleAskAI} disabled={isLoading}>{isLoading ? 'Thinking...' : 'Ask'}</button>
                                </div>
                                {aiResponse && (<div className="ai-response"><p><strong>Aya says:</strong> {aiResponse}</p></div>)}
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="trading-section card">
                                <div className="trading-header">
                                    <h3>Swap Tokens</h3>
                                    <div className="slippage-setter">
                                        <label>Slippage:</label>
                                        <input type="number" value={slippage} onChange={(e) => setSlippage(e.target.value)} step="0.1" min="0.1" />
                                        <span>%</span>
                                    </div>
                                </div>

                                <small>Balance: {fromTokenBalance} {fromToken}</small>
                                <div className="token-input-container">
                                    <input type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="token-input" />
                                    <div className="token-label">
                                        <img src={TOKENS[fromToken]?.logo} alt={fromToken} />
                                        {renderTokenDropdown(fromToken, setFromToken, toToken)}
                                    </div>
                                </div>
                                <p className="arrow-down">↓</p>
                                <div className="token-input-container">
                                    <input type="text" placeholder="0.0" readOnly value={getQuoteDisplay()} className="token-input quote-output" />
                                    <div className="token-label">
                                        <img src={TOKENS[toToken]?.logo} alt={toToken} />
                                        {renderTokenDropdown(toToken, setToToken, fromToken)}
                                    </div>
                                </div>
                                <button
                                    onClick={handleSwap}
                                    disabled={isTrading || !fromAmount || !toAmount || toAmount === "N/A" || isMockQuote}
                                    className="swap-button"
                                    title={isMockQuote ? "Swap is disabled for simulated prices" : ""}
                                >
                                    {isTrading ? 'Executing...' : 'Swap'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </header>
        </div>
    );
}
export default Dashboard;
