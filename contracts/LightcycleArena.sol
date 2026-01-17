// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title LightcycleArena
 * @dev Smart contract for managing Lightcycle Arena game deposits and payouts
 */
contract LightcycleArena {
    struct Game {
        uint256 gameId;
        uint256 entryFee;
        uint256 totalPot;
        address[] players;
        address[] winners;
        uint256[] prizes;
        bool isComplete;
        uint256 createdAt;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameCounter;
    address public owner;
    address public platformWallet;
    uint256 public platformFeePercent = 10; // 10%
    
    uint256 public constant MAX_PLAYERS = 16;
    uint256 public constant FIRST_PLACE_PERCENT = 69;
    uint256 public constant SECOND_PLACE_PERCENT = 21;
    uint256 public constant THIRD_PLACE_PERCENT = 10;

    event GameCreated(uint256 indexed gameId, uint256 entryFee, uint256 timestamp);
    event PlayerJoined(uint256 indexed gameId, address indexed player, uint256 amount);
    event GameCompleted(uint256 indexed gameId, address[] winners, uint256[] prizes);
    event PlatformFeeUpdated(uint256 newFeePercent);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor(address _platformWallet) {
        owner = msg.sender;
        platformWallet = _platformWallet;
    }

    /**
     * @dev Create a new game
     * @param _entryFee Entry fee in SUN (1 TRX = 1,000,000 SUN)
     */
    function createGame(uint256 _entryFee) external onlyOwner returns (uint256) {
        gameCounter++;
        
        games[gameCounter] = Game({
            gameId: gameCounter,
            entryFee: _entryFee,
            totalPot: 0,
            players: new address[](0),
            winners: new address[](0),
            prizes: new uint256[](0),
            isComplete: false,
            createdAt: block.timestamp
        });

        emit GameCreated(gameCounter, _entryFee, block.timestamp);
        return gameCounter;
    }

    /**
     * @dev Join an existing game
     * @param _gameId ID of the game to join
     */
    function joinGame(uint256 _gameId) external payable {
        Game storage game = games[_gameId];
        
        require(!game.isComplete, "Game already completed");
        require(game.players.length < MAX_PLAYERS, "Game is full");
        require(msg.value == game.entryFee, "Incorrect entry fee");
        require(!hasPlayerJoined(_gameId, msg.sender), "Already joined");

        game.players.push(msg.sender);
        game.totalPot += msg.value;

        emit PlayerJoined(_gameId, msg.sender, msg.value);
    }

    /**
     * @dev Complete a game and distribute prizes
     * @param _gameId ID of the game to complete
     * @param _winners Array of winner addresses (must be 3)
     */
    function completeGame(uint256 _gameId, address[] memory _winners) external onlyOwner {
        Game storage game = games[_gameId];
        
        require(!game.isComplete, "Game already completed");
        require(_winners.length == 3, "Must have exactly 3 winners");
        require(game.totalPot > 0, "No pot to distribute");

        game.isComplete = true;
        game.winners = _winners;

        // Calculate platform fee
        uint256 platformFee = (game.totalPot * platformFeePercent) / 100;
        uint256 prizePool = game.totalPot - platformFee;

        // Calculate prizes
        uint256 firstPrize = (prizePool * FIRST_PLACE_PERCENT) / 100;
        uint256 secondPrize = (prizePool * SECOND_PLACE_PERCENT) / 100;
        uint256 thirdPrize = prizePool - firstPrize - secondPrize;

        game.prizes = new uint256[](3);
        game.prizes[0] = firstPrize;
        game.prizes[1] = secondPrize;
        game.prizes[2] = thirdPrize;

        // Transfer prizes
        payable(_winners[0]).transfer(firstPrize);
        payable(_winners[1]).transfer(secondPrize);
        payable(_winners[2]).transfer(thirdPrize);
        
        // Transfer platform fee
        payable(platformWallet).transfer(platformFee);

        emit GameCompleted(_gameId, _winners, game.prizes);
    }

    /**
     * @dev Check if a player has already joined a game
     */
    function hasPlayerJoined(uint256 _gameId, address _player) public view returns (bool) {
        Game storage game = games[_gameId];
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == _player) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Get game details
     */
    function getGame(uint256 _gameId) external view returns (
        uint256 gameId,
        uint256 entryFee,
        uint256 totalPot,
        uint256 playerCount,
        bool isComplete
    ) {
        Game storage game = games[_gameId];
        return (
            game.gameId,
            game.entryFee,
            game.totalPot,
            game.players.length,
            game.isComplete
        );
    }

    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(uint256 _newFeePercent) external onlyOwner {
        require(_newFeePercent <= 20, "Fee too high"); // Max 20%
        platformFeePercent = _newFeePercent;
        emit PlatformFeeUpdated(_newFeePercent);
    }

    /**
     * @dev Update platform wallet
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
