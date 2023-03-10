// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

async function main() {
    ;[buyer, seller, inspector, lender] = await ethers.getSigners()
    const realEstateContract = await ethers.getContractFactory("RealEstate")
    const realEstate = await realEstateContract.deploy()

    await realEstate.deployed()

    console.log(`Deployed real estate contract at: ${realEstate.address}`)
    console.log(`Minting 3 NFTs........`)
    for (let i = 0; i < 3; i++) {
        const tx = await realEstate
            .connect(seller)
            .mintPropertyNFT(
                `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
                    i + 1
                }.json`
            )
        await tx.wait()
    }

    const escrowContract = await ethers.getContractFactory("Escrow")
    const escrow = await escrowContract.deploy(
        realEstate.address,
        lender.address,
        inspector.address,
        seller.address
    )
    await escrow.deployed()
    console.log(`Deployed Escrow contract at: ${escrow.address}`)
    console.log(`Approving properties........`)

    for (let i = 0; i < 3; i++) {
        const tx = await realEstate
            .connect(seller)
            .approve(escrow.address, i + 1)
        await tx.wait()
    }

    console.log(`Listing 3 properties...\n`)

    // Listing properties...
    transaction = await escrow
        .connect(seller)
        .list(1, tokens(20), tokens(10), buyer.address)
    await transaction.wait()

    transaction = await escrow
        .connect(seller)
        .list(2, tokens(15), tokens(5), buyer.address)
    await transaction.wait()

    transaction = await escrow
        .connect(seller)
        .list(3, tokens(10), tokens(5), buyer.address)
    await transaction.wait()

    console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})
