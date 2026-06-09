// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {WorldCupBettingVault} from "../src/WorldCupBettingVault.sol";
import {MockWorldCupViewer} from "../src/MockWorldCupViewer.sol";

interface Vm {
    function deal(address who, uint256 newBalance) external;
    function prank(address msgSender) external;
    function warp(uint256 newTimestamp) external;
    function expectRevert(bytes calldata revertData) external;
}

contract WorldCupBettingVaultTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    MockWorldCupViewer internal viewer;
    WorldCupBettingVault internal vault;

    address internal guardian = address(0xA11CE);
    address internal operator = address(0xB0B);
    address internal alice = address(0xCAFE);
    address internal bob = address(0xBEEF);

    function setUp() public {
        viewer = new MockWorldCupViewer(address(this));
        vault = new WorldCupBettingVault(address(viewer), guardian, operator);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function testInitialRoles() public view {
        assertEq(address(vault.worldCupViewer()), address(viewer));
        assertEq(vault.guardian(), guardian);
        assertEq(vault.operator(), operator);
        assertEq(vault.marketCount(), 0);
    }

    function testOperatorCanCreateOpenAndUsersCanBetWithdraw() public {
        uint256[] memory outcomes = twoOutcomes();
        vm.prank(operator);
        uint256 marketId = vault.createMarket(100, WorldCupBettingVault.MarketType.MatchWinner, "Mexico vs Canada", 0, 1000, 1000, outcomes, 100);

        vm.prank(operator);
        vault.openMarket(marketId);

        vm.warp(100);
        vm.prank(alice);
        vault.placeBet{value: 1 ether}(marketId, 1);

        assertEq(vault.getUserBet(marketId, alice, 1), 0.99 ether);

        vm.prank(alice);
        vault.withdrawBet(marketId, 1, 0.4 ether);

        assertEq(vault.getUserBet(marketId, alice, 1), 0.59 ether);
    }

    function testResolveAndClaimPaysWinnerProRata() public {
        uint256[] memory outcomes = twoOutcomes();
        vm.prank(operator);
        uint256 marketId = vault.createMarket(100, WorldCupBettingVault.MarketType.MatchWinner, "Mexico vs Canada", 0, 1000, 1000, outcomes, 100);
        vm.prank(operator);
        vault.openMarket(marketId);

        vm.warp(100);
        vm.prank(alice);
        vault.placeBet{value: 1 ether}(marketId, 1);
        vm.prank(bob);
        vault.placeBet{value: 1 ether}(marketId, 5);

        viewer.setMatchResult(100, "Mexico vs Canada", true, 1);
        vm.warp(1000);
        vault.resolveMarket(marketId);

        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        vault.claim(marketId);
        assertEq(alice.balance - beforeBalance, 1.98 ether);

        vm.prank(bob);
        vm.expectRevert(bytes("nothing to claim"));
        vault.claim(marketId);
    }


    function testTaxRewardsAreClaimableByBettorsProRata() public {
        uint256[] memory outcomes = twoOutcomes();
        vm.prank(operator);
        uint256 marketId = vault.createMarket(100, WorldCupBettingVault.MarketType.MatchWinner, "Mexico vs Canada", 0, 1000, 1000, outcomes, 100);
        vm.prank(operator);
        vault.openMarket(marketId);

        vm.warp(100);
        vm.prank(alice);
        vault.placeBet{value: 1 ether}(marketId, 1); // 0.99 reward shares
        vm.prank(bob);
        vault.placeBet{value: 2 ether}(marketId, 5); // 1.98 reward shares

        vault.depositTaxRewards{value: 0.3 ether}();
        assertEq(vault.claimableTaxRewards(alice), 0.1 ether);
        assertEq(vault.claimableTaxRewards(bob), 0.2 ether);

        uint256 beforeAlice = alice.balance;
        vm.prank(alice);
        vault.claimTaxRewards();
        assertEq(alice.balance - beforeAlice, 0.1 ether);
    }

    function testCancelRefundsNetStake() public {
        uint256[] memory outcomes = twoOutcomes();
        vm.prank(operator);
        uint256 marketId = vault.createMarket(100, WorldCupBettingVault.MarketType.MatchWinner, "Mexico vs Canada", 0, 1000, 1000, outcomes, 100);
        vm.prank(operator);
        vault.openMarket(marketId);

        vm.warp(100);
        vm.prank(alice);
        vault.placeBet{value: 1 ether}(marketId, 1);

        vm.prank(guardian);
        vault.cancelMarket(marketId, "test cancel");

        uint256 beforeBalance = alice.balance;
        vm.prank(alice);
        vault.refund(marketId);
        assertEq(alice.balance - beforeBalance, 0.99 ether);
    }

    function testNonOperatorCannotCreateMarket() public {
        vm.expectRevert(bytes("not operator/guardian"));
        vault.createMarket(100, WorldCupBettingVault.MarketType.MatchWinner, "Mexico vs Canada", 0, 1000, 1000, twoOutcomes(), 100);
    }

    function twoOutcomes() internal pure returns (uint256[] memory outcomes) {
        outcomes = new uint256[](2);
        outcomes[0] = 1;
        outcomes[1] = 5;
    }

    function assertEq(address a, address b) internal pure {
        require(a == b, "assert address eq failed");
    }

    function assertEq(uint256 a, uint256 b) internal pure {
        require(a == b, "assert uint eq failed");
    }
}
