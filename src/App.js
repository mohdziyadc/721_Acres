import { useEffect, useState } from "react"
import { ethers } from "ethers"

// Components
import Navigation from "./components/Navigation"
import Search from "./components/Search"
import Home from "./components/Home"

// ABIs
import RealEstate from "./abis/RealEstate.json"
import Escrow from "./abis/Escrow.json"

// Config
import config from "./config.json"
import Card from "./components/Card"

function App() {
    const [account, setAccount] = useState(null)
    const [provider, setProvider] = useState(null)
    const [homes, setHomes] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [home, setHome] = useState({})
    const [escrow, setEscrow] = useState()
    const loadBlockchainData = async () => {
        if (typeof window.ethereum != "undefined") {
            const provider = new ethers.providers.Web3Provider(window.ethereum) //provider for connecting to blockchain
            setProvider(provider)

            const network = await provider.getNetwork()

            const realEstateAddress = config[network.chainId].realEstate.address
            const escrowAddress = config[network.chainId].escrow.address

            const realEstate = new ethers.Contract(
                realEstateAddress,
                RealEstate.abi,
                provider
            )
            const escrow = new ethers.Contract(
                escrowAddress,
                Escrow.abi,
                provider
            )

            setEscrow(escrow)

            const totalHomes = await realEstate.totalSupply()
            console.log(`total homes: ${totalHomes}`)

            for (let i = 1; i <= totalHomes; i++) {
                const uri = await realEstate.tokenURI(i)
                const response = await fetch(uri)
                console.log(response)
                const metadata = await response.json()
                homes.push(metadata)
            }
            setHomes(homes)
        }

        window.ethereum.on("accountsChanged", async () => {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            })
            const account = ethers.utils.getAddress(accounts[0])
            setAccount(account)
        })
    }

    const showModalBox = (home) => {
        showModal ? setShowModal(false) : setShowModal(true)
        setHome(home)
        console.log(`Home: ${home}`)
    }
    useEffect(() => {
        loadBlockchainData()
    }, [])
    return (
        <div>
            <Navigation account={account} setAccount={setAccount} />
            <Search />
            <div className="p-8">
                <h3 className="text-xl font-semibold pb-4">Homes For You</h3>
                <hr />

                {account ? (
                    <div className="grid grid-cols-3 gap-4">
                        {homes.map((home, index) => {
                            console.log(`Home 1: ${home}`)
                            return (
                                <div
                                    onClick={() => {
                                        showModalBox(home)
                                    }}
                                >
                                    <Card
                                        key={index}
                                        image={home.image}
                                        price={home.attributes[0].value}
                                        beds={home.attributes[2].value}
                                        bathrooms={home.attributes[3].value}
                                        sqft={home.attributes[4].value}
                                        address={home.address}
                                    />
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-auto justify-center items-center font-light ">
                        Please connect Wallet
                    </div>
                )}
            </div>

            {showModal && (
                <Home
                    home={home}
                    provider={provider}
                    escrow={escrow}
                    showModal={showModalBox}
                    account={account}
                />
            )}
        </div>
    )
}

export default App
