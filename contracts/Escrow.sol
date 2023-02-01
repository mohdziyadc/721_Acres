//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(address _from, address _to, uint256 _id) external;
}

error Escrow__OnlySellerCanList();
error Escrow__OnlyBuyerMethod();
error Escrow__OnlyInspectorAllowed();
error Escrow__TransferFailed();

contract Escrow {
    address public lender;
    address public inspector;
    address payable public seller;
    address public nftAddress;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public s_purchasePrice;
    mapping(uint256 => uint256) public s_escrowAmount; //like down payment
    mapping(uint256 => address) public s_buyer;
    mapping(uint256 => bool) public s_inspectionPassed;

    /**
     * tokenId -> mapping(address of the involved party -> their approval)
     */
    mapping(uint256 => mapping(address => bool)) public s_approval;

    modifier onlySeller() {
        if (msg.sender != seller) {
            revert Escrow__OnlySellerCanList();
        }
        _;
    }

    modifier onlyBuyer(uint256 tokenId) {
        if (msg.sender != s_buyer[tokenId]) {
            revert Escrow__OnlyBuyerMethod();
        }
        _;
    }

    modifier onlyInspector() {
        if (msg.sender != inspector) {
            revert Escrow__OnlyInspectorAllowed();
        }
        _;
    }

    constructor(
        address _nftAddress,
        address _lender,
        address _inspector,
        address payable _seller
    ) {
        lender = _lender;
        inspector = _inspector;
        seller = _seller;
        nftAddress = _nftAddress;
    }

    function list(
        uint256 tokenId,
        uint256 purchasePrice,
        uint256 escrowAmount,
        address buyer
    ) public payable onlySeller {
        //Transfer NFT from seller to the Escrow contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);

        isListed[tokenId] = true;
        s_purchasePrice[tokenId] = purchasePrice;
        s_escrowAmount[tokenId] = escrowAmount;
        s_buyer[tokenId] = buyer;
    }

    function depositEarnest(uint256 tokenId) public payable onlyBuyer(tokenId) {
        require(
            msg.value >= s_escrowAmount[tokenId],
            "The ETH deposit should be greater than escrow amount"
        );
    }

    receive() external payable {} //to recieve ether from another account

    function updateInspectionStatus(
        uint256 tokenId,
        bool passed
    ) public onlyInspector {
        s_inspectionPassed[tokenId] = passed;
    }

    function approveSale(uint256 tokenId) public {
        s_approval[tokenId][msg.sender] = true;
    }

    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller
    function finalizeSale(uint256 tokenId) public {
        require(s_inspectionPassed[tokenId]);
        require(s_approval[tokenId][s_buyer[tokenId]]); //buyer approval
        require(s_approval[tokenId][seller]);
        require(s_approval[tokenId][lender]);
        require(address(this).balance >= s_purchasePrice[tokenId]);

        isListed[tokenId] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );

        if (!success) {
            revert Escrow__TransferFailed();
        }

        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);
    }

    //CancelSale
    // -> if inspection status is not approved, then refund, otherwise send to selle
    function cancelSale(uint256 tokenId) public {
        if (s_inspectionPassed[tokenId] == false) {
            payable(s_buyer[tokenId]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getApprovalOf(
        uint256 tokenId,
        address approver
    ) public view returns (bool) {
        return s_approval[tokenId][approver];
    }
}
