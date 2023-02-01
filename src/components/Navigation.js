import logo from "../assets/logo.svg"
import { ethers } from "ethers"

const Navigation = ({ account, setAccount }) => {
    const connectHandler = async () => {
        if (typeof window.ethereum != "undefined") {
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            })
            const account = ethers.utils.getAddress(accounts[0])
            setAccount(account)
        } else {
            console.log("Please install metamask")
        }
    }
    return (
        <nav className="bg-gradient-to-r from-gray-700 via-gray-900 to-black">
            <div className="px-4 flex flex-row justify-between">
                <ul className="flex flex-row p-4 items-center w-1/4 justify-around text-white  font-semibold text-lg">
                    <li>
                        <a href="#" className="focus:text-fuchsia-400">
                            Buy
                        </a>
                    </li>
                    <li>
                        <a href="#" className="focus:text-fuchsia-400">
                            Rent
                        </a>
                    </li>
                    <li>
                        <a href="#" className="focus:text-fuchsia-400">
                            Sell
                        </a>
                    </li>
                </ul>
                <div className="flex flex-row justify-center items-center w-2/4">
                    <img src={logo} width={90} height={90} />
                    <h1 className="py-4 px-2 font-sans font-bold text-5xl  bg-gradient-to-r from-pink-300 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        721 Acres
                    </h1>
                </div>

                <div className="flex w-1/4 justify-end p-4 items-center">
                    {account ? (
                        <button className="bg-fuchsia-500 hover:bg-fuchsia-600 px-2 py-3 w-40 rounded-lg ">
                            <p className="bg-gradient-to-r from-rose-100 to-teal-100 text-transparent bg-clip-text font-sans font-semibold text-base">
                                {account.slice(0, 6) +
                                    "..." +
                                    account.slice(38, 42)}
                            </p>
                        </button>
                    ) : (
                        <button
                            className="bg-fuchsia-500 hover:bg-fuchsia-600 px-2 py-3 w-40 rounded-lg "
                            onClick={connectHandler}
                        >
                            <p className="bg-gradient-to-r from-rose-100 to-teal-100 text-transparent bg-clip-text font-sans font-semibold text-lg">
                                Connect
                            </p>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navigation
