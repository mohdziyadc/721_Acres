const { assert, expect } = require("chai")
const { ethers } = require("hardhat")

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether")
}

describe("Escrow Unit Tests", () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow
    beforeEach(async () => {
        // const accounts = await ethers.getSigners()
        // buyer = accounts[0]
        // seller = accounts[1]
        // inspector = accounts[2]
        // lender = accounts[3]
        ;[buyer, seller, inspector, lender] = await ethers.getSigners()
        const realEstateContract = await ethers.getContractFactory("RealEstate")
        realEstate = await realEstateContract.deploy()

        const tx = await realEstate
            .connect(seller)
            .mintPropertyNFT(
                "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
            )
        await tx.wait()

        const escrowContract = await ethers.getContractFactory("Escrow")
        escrow = await escrowContract.deploy(
            realEstate.address,
            lender.address,
            inspector.address,
            seller.address
        )

        //Approving NFT
        const approvalTx = await realEstate
            .connect(seller)
            .approve(escrow.address, 1)
        await approvalTx.wait()
    })

    describe("constructor", () => {
        it("checks if initial values are correct", async () => {
            expect(await escrow.nftAddress()).to.be.equal(realEstate.address)
            expect(await escrow.seller()).to.be.equal(seller.address)
            expect(await escrow.inspector()).to.be.equal(inspector.address)
            expect(await escrow.lender()).to.be.equal(lender.address)
        })
    })

    describe("Listing", () => {
        beforeEach(async () => {
            const tx = await escrow
                .connect(seller)
                .list(1, tokens(10), tokens(5), buyer.address)
            const reciept = await tx.wait()
        })
        it("transfers the ownership and updates listing", async () => {
            assert.equal(await realEstate.ownerOf(1), escrow.address)
            expect(await escrow.isListed(1)).to.be.equal(true)
        })
        it("Returns buyer, escrow Amount and purchase price", async () => {
            expect(await escrow.s_buyer(1)).to.be.equal(buyer.address)
            expect(await escrow.s_escrowAmount(1)).to.be.equal(tokens(5))
            expect(await escrow.s_purchasePrice(1)).to.be.equal(tokens(10))
        })

        it("makes sure only seller can call the function", async () => {
            const tx = escrow.list(2, tokens(9), tokens(4), buyer.address) //buyer does this tx
            await expect(tx).to.be.revertedWithCustomError(
                escrow,
                "Escrow__OnlySellerCanList"
            )
        })
    })

    describe("despositEarnest", () => {
        beforeEach(async () => {
            const tx = await escrow
                .connect(seller)
                .list(1, tokens(10), tokens(5), buyer.address)
            await tx.wait()
        })
        it("Updates contract balance", async () => {
            const tx = await escrow
                .connect(buyer)
                .depositEarnest(1, { value: tokens(5) })

            await tx.wait()
            const balance = await escrow.getBalance()
            assert.equal(balance.toString(), tokens(5).toString())
        })
    })

    describe("updateInspectionStatus", () => {
        it("updates the inspection status", async () => {
            const tx = await escrow
                .connect(inspector)
                .updateInspectionStatus(1, true)
            const reciept = await tx.wait()
            const inspectionPassed = await escrow.s_inspectionPassed(1)
            assert.equal(inspectionPassed, true)
        })

        it("verifies that only inspector can access it", async () => {
            await expect(
                escrow.updateInspectionStatus(1, true)
            ).to.be.revertedWithCustomError(
                escrow,
                "Escrow__OnlyInspectorAllowed"
            )
        })
    })

    describe("approveSale", () => {
        it("approves the sale", async () => {
            await escrow.approveSale(1)
            const approvalMapping = await escrow.s_approval(1, buyer.address)
            assert.equal(approvalMapping, true)
        })
    })

    describe("finalizeSale", () => {
        beforeEach(async () => {
            const tx = await escrow
                .connect(seller)
                .list(1, tokens(10), tokens(5), buyer.address)
            await tx.wait()
            let transaction = await escrow
                .connect(buyer)
                .depositEarnest(1, { value: tokens(5) })
            await transaction.wait()

            transaction = await escrow
                .connect(inspector)
                .updateInspectionStatus(1, true)
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()

            await lender.sendTransaction({
                to: escrow.address,
                value: tokens(5),
            })

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it("Updates ownership", async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(seller.address)
        })

        it("Updates balance", async () => {
            expect(await escrow.getBalance()).to.be.equal(0)
        })
    })
})
