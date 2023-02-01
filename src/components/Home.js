import { ethers } from "ethers"
import { useEffect, useState } from "react"

import close from "../assets/close.svg"

const Home = ({ home, provider, account, escrow, showModal }) => {
    const [buyer, setBuyer] = useState(null)
    const [lender, setLender] = useState(null)
    const [inspector, setInspector] = useState(null)
    const [seller, setSeller] = useState(null)
    const [owner, setOwner] = useState(null)

    const [buyBtnText, setBuyBtnText] = useState("Buy")

    const [hasLended, setHasLended] = useState(false)
    const [hasInspected, setHasInspected] = useState(false)
    const [hasSold, setHasSold] = useState(false)
    const [hasBought, setHasBought] = useState(false)
    const fetchDetails = async () => {
        const buyer = await escrow.s_buyer(home.id)
        setBuyer(buyer)
        console.log(`Buyer: ${buyer}`)

        const seller = await escrow.seller()
        setSeller(seller)

        const lender = await escrow.lender()
        setLender(lender)

        const inspector = await escrow.inspector()
        setInspector(inspector)

        // const hasBought = await escrow.getApprovalOf(home.id, buyer)
        // setHasBought(hasBought)
        // console.log(`Buyer Approval: ${hasBought}`)

        const hasLended = await escrow.getApprovalOf(home.id, lender)
        setHasLended(hasLended)
        const hasInspected = await escrow.s_inspectionPassed(home.id)
        setHasInspected(hasInspected)
        const hasSold = await escrow.getApprovalOf(home.id, seller)
        setHasSold(hasSold)
    }

    const fetchOwner = async () => {
        if (await escrow.isListed(home.id)) return

        const owner = await escrow.s_buyer(home.id)
        setOwner(owner)
    }

    const buyHandler = async () => {
        const signer = await provider.getSigner()
        const depositAmount = await escrow
            .connect(signer)
            .s_escrowAmount(home.id)

        const tx = await escrow
            .connect(signer)
            .depositEarnest(home.id, { value: depositAmount })

        await tx.wait()

        const approvalTx = await escrow.connect(signer).approveSale(home.id)
        await approvalTx.wait()

        setHasBought(true)
    }
    const inspectHandler = async () => {
        const signer = await provider.getSigner()

        const tx = await escrow
            .connect(signer)
            .updateInspectionStatus(home.id, true)
        await tx.wait()

        setHasInspected(true)
    }
    const lendHandler = async () => {
        const signer = await provider.getSigner()

        const lendAmount =
            (await escrow.s_purchasePrice(home.id)) -
            (await escrow.s_escrowAmount(home.id))

        await signer.sendTransaction({
            to: escrow.address,
            value: lendAmount.toString(),
            gasLimit: 60000,
        })

        // Lender approves...
        const transaction = await escrow.connect(signer).approveSale(home.id)
        await transaction.wait()

        setHasLended(true)
    }
    const sellHandler = async () => {
        const signer = await provider.getSigner()

        // Seller approves...
        const approvalTx = await escrow.connect(signer).approveSale(home.id)
        await approvalTx.wait()

        const saleTx = await escrow.connect(signer).finalizeSale(home.id)
        await saleTx.wait()

        setHasSold(true)
    }

    useEffect(() => {
        fetchDetails()
        fetchOwner()
    }, [hasSold])
    return (
        <div className="home">
            <div className="home__details rounded-md">
                <div className="home__image ">
                    <img src={home.image} alt="Home" className="rounded" />
                </div>
                <div className="flex flex-col h-full  ">
                    <h1 className="text-xl font-bold">{home.name}</h1>
                    <p>
                        <strong>{home.attributes[2].value}</strong> bedrooms |
                        <strong>{home.attributes[3].value}</strong> bathrooms |
                        <strong>{home.attributes[4].value}</strong> sqft
                    </p>
                    <p>{home.address}</p>

                    <h2 className="text-xl font-bold  my-3   ">
                        {home.attributes[0].value} ETH
                    </h2>

                    {owner ? (
                        <div className=" bg-green-600 w-full px-4 py-3 rounded-md text-white flex justify-center items-center font-semibold ">
                            Owned by{" "}
                            {owner.slice(0, 6) + "..." + owner.slice(38, 42)}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {account === inspector ? (
                                <button
                                    onClick={inspectHandler}
                                    disabled={hasInspected}
                                    className=" disabled:bg-slate-500  bg-fuchsia-500 hover:bg-fuchsia-700 w-1/3 px-4 py-3 rounded-md text-white font-semibold"
                                >
                                    Approve Inspection
                                </button>
                            ) : account === lender ? (
                                <button
                                    onClick={lendHandler}
                                    disabled={hasLended}
                                    className="  disabled:bg-slate-500 bg-fuchsia-500 hover:bg-fuchsia-700 w-1/3 px-4 py-3 rounded-md text-white font-semibold"
                                >
                                    Approve & Lend
                                </button>
                            ) : account === seller ? (
                                <button
                                    onClick={sellHandler}
                                    disabled={hasSold}
                                    className=" disabled:bg-slate-500 bg-fuchsia-500 hover:bg-fuchsia-700 w-1/3 px-4 py-3 rounded-md text-white font-semibold"
                                >
                                    Approve & Sell
                                </button>
                            ) : (
                                <button
                                    onClick={buyHandler}
                                    disabled={hasBought}
                                    className="disabled:bg-slate-500  bg-fuchsia-500 hover:bg-fuchsia-700 w-1/3 px-4 py-3 rounded-md text-white font-semibold"
                                >
                                    {buyBtnText}
                                </button>
                            )}

                            <button class="bg-transparent hover:bg-fuchsia-500  text-fuchsia-800 font-semibold hover:text-white py-3 px-4 border-2  border-fuchsia-200 hover:border-transparent rounded w-1/3 my-3">
                                Contact Agent
                            </button>
                        </div>
                    )}

                    <hr />

                    <h2 className="text-xl font-bold pt-2">Overview</h2>

                    <p className="mb-2">{home.description}</p>

                    <hr />

                    <h2 className="text-xl font-bold pt-2">
                        Facts and features
                    </h2>

                    <ul className="list-disc px-6">
                        {home.attributes.map((attribute, index) => (
                            <li key={index}>
                                <strong>{attribute.trait_type}</strong> :{" "}
                                {attribute.value}
                            </li>
                        ))}
                    </ul>
                </div>
                <button onClick={showModal} className="home__close">
                    <img src={close} alt="Close" />
                </button>
            </div>
        </div>
    )
}

export default Home
