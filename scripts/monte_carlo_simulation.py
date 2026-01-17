"""
QRON Game Monte Carlo Simulation
================================
Tests game mechanics, expected value, and fairness analysis.

This script simulates thousands of games to analyze:
1. Expected value for players
2. Win rate distribution
3. House edge verification
4. Variance and risk analysis
5. Skill vs luck ratio
"""

import random
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple
from collections import defaultdict
import json

# Game mode configurations (matching server)
GAME_MODES = {
    "duel": {"players": 2, "entry": 0.50, "prize": 0.90, "grid": 36},
    "squad": {"players": 4, "entry": 0.50, "prize": 1.40, "grid": 52},
    "ranked": {"players": 8, "entry": 1.00, "prize": 5.60, "grid": 84},
    "arena": {"players": 10, "entry": 1.00, "prize": 7.00, "grid": 112},
}

# Payout structures (matching server)
PAYOUTS = {
    2: [(1, 1.0)],  # 1v1: Winner takes all
    4: [(1, 0.75), (2, 0.25)],  # Squad: Top 2
    8: [(1, 0.694), (2, 0.208), (3, 0.098)],  # Ranked: Top 3
    10: [(1, 0.694), (2, 0.208), (3, 0.098)],  # Arena: Top 3
}

@dataclass
class Player:
    id: int
    skill: float  # 0.0 to 1.0, affects survival probability
    position: Tuple[int, int]
    alive: bool = True
    
@dataclass
class GameResult:
    mode: str
    rankings: List[int]  # Player IDs in finish order
    duration_ticks: int

def simulate_player_skill() -> float:
    """Generate random skill level with slight bias towards average."""
    return min(1.0, max(0.0, random.gauss(0.5, 0.2)))

def simulate_game(mode: str, player_skills: List[float] = None) -> GameResult:
    """
    Simulate a single game with given mode.
    
    The simulation models:
    - Collision probability based on arena density
    - Skill affects reaction time and decision quality
    - Progressive speed increase (matching server)
    - Arena shrink pressure
    """
    config = GAME_MODES[mode]
    num_players = config["players"]
    grid_size = config["grid"]
    
    # Create players with skills
    if player_skills is None:
        player_skills = [simulate_player_skill() for _ in range(num_players)]
    
    players = [
        Player(id=i, skill=player_skills[i], position=(0, 0))
        for i in range(num_players)
    ]
    
    rankings = []
    tick = 0
    max_ticks = 3000  # ~2.5 minutes at 20Hz
    
    # Progressive game speed (matching server implementation)
    base_collision_chance = 0.005  # Base chance per tick per player
    speed_multiplier = 1.0
    
    while len([p for p in players if p.alive]) > 1 and tick < max_ticks:
        tick += 1
        
        # Speed increases every 100 ticks (5 seconds at 20Hz)
        if tick % 100 == 0:
            speed_multiplier = min(2.5, speed_multiplier + 0.15)
        
        # Arena shrink increases danger
        arena_factor = 1.0 + (tick / max_ticks) * 2.0
        
        # Calculate density (more players = more danger)
        alive_count = len([p for p in players if p.alive])
        density_factor = alive_count / num_players
        
        for player in players:
            if not player.alive:
                continue
            
            # Collision probability formula:
            # Base chance * speed * arena_shrink * density / skill
            # Higher skill = lower collision chance
            skill_factor = 0.3 + (player.skill * 0.7)  # Skill reduces risk by up to 70%
            
            collision_chance = (
                base_collision_chance 
                * speed_multiplier 
                * arena_factor 
                * density_factor 
                / skill_factor
            )
            
            # Check if player collides this tick
            if random.random() < collision_chance:
                player.alive = False
                rankings.append(player.id)
    
    # Add remaining players (winners) to rankings
    alive_players = [p for p in players if p.alive]
    random.shuffle(alive_players)  # Randomize final placement if multiple survive
    for p in alive_players:
        rankings.append(p.id)
    
    # Reverse rankings (first to die = last place)
    rankings.reverse()
    
    return GameResult(mode=mode, rankings=rankings, duration_ticks=tick)

def calculate_ev(mode: str, player_rank: int) -> float:
    """Calculate expected value for a player finishing at given rank."""
    config = GAME_MODES[mode]
    prize_pool = config["prize"]
    entry_fee = config["entry"]
    
    payouts = PAYOUTS[config["players"]]
    
    for rank, pct in payouts:
        if player_rank == rank:
            return (prize_pool * pct) - entry_fee
    
    return -entry_fee  # Lost

def run_monte_carlo(
    num_simulations: int = 10000,
    mode: str = "ranked",
    player_skill: float = 0.5
) -> Dict:
    """
    Run Monte Carlo simulation for expected value analysis.
    
    Returns comprehensive statistics about game fairness and player outcomes.
    """
    config = GAME_MODES[mode]
    num_players = config["players"]
    
    results = {
        "mode": mode,
        "simulations": num_simulations,
        "player_skill": player_skill,
        "config": config,
        "rank_distribution": defaultdict(int),
        "total_profit": 0.0,
        "profits": [],
        "game_durations": [],
    }
    
    for _ in range(num_simulations):
        # Simulate game with our player (ID 0) at specified skill level
        skills = [player_skill] + [simulate_player_skill() for _ in range(num_players - 1)]
        game = simulate_game(mode, skills)
        
        # Find our player's rank
        player_rank = game.rankings.index(0) + 1
        results["rank_distribution"][player_rank] += 1
        
        # Calculate profit/loss
        ev = calculate_ev(mode, player_rank)
        results["profits"].append(ev)
        results["total_profit"] += ev
        results["game_durations"].append(game.duration_ticks)
    
    # Calculate statistics
    profits = np.array(results["profits"])
    results["statistics"] = {
        "expected_value": float(np.mean(profits)),
        "std_deviation": float(np.std(profits)),
        "median_profit": float(np.median(profits)),
        "min_profit": float(np.min(profits)),
        "max_profit": float(np.max(profits)),
        "win_rate": sum(1 for p in profits if p > 0) / num_simulations * 100,
        "break_even_rate": sum(1 for p in profits if p >= 0) / num_simulations * 100,
        "avg_game_duration_ticks": float(np.mean(results["game_durations"])),
        "avg_game_duration_seconds": float(np.mean(results["game_durations"])) / 20,  # 20Hz tick rate
    }
    
    # House edge calculation
    total_entry = config["entry"] * num_players
    total_prize = config["prize"]
    house_take = total_entry - total_prize
    house_edge_pct = (house_take / total_entry) * 100
    results["house_analysis"] = {
        "total_entry_per_game": total_entry,
        "total_prize_per_game": total_prize,
        "house_take_per_game": house_take,
        "house_edge_percent": house_edge_pct,
    }
    
    # Skill impact analysis
    # Run quick sims at different skill levels
    skill_impact = {}
    for test_skill in [0.2, 0.5, 0.8]:
        test_profits = []
        for _ in range(1000):
            skills = [test_skill] + [simulate_player_skill() for _ in range(num_players - 1)]
            game = simulate_game(mode, skills)
            player_rank = game.rankings.index(0) + 1
            test_profits.append(calculate_ev(mode, player_rank))
        skill_impact[f"skill_{test_skill}"] = {
            "expected_value": float(np.mean(test_profits)),
            "win_rate": sum(1 for p in test_profits if p > 0) / 1000 * 100,
        }
    results["skill_impact_analysis"] = skill_impact
    
    return results

def analyze_all_modes(num_simulations: int = 5000) -> Dict:
    """Analyze all game modes and compare fairness."""
    all_results = {}
    
    for mode in GAME_MODES.keys():
        print(f"Simulating {mode}...")
        all_results[mode] = run_monte_carlo(num_simulations, mode, player_skill=0.5)
    
    return all_results

def print_report(results: Dict):
    """Print formatted analysis report."""
    print("\n" + "="*60)
    print(f"QRON MONTE CARLO SIMULATION REPORT")
    print(f"Mode: {results['mode'].upper()}")
    print(f"Simulations: {results['simulations']:,}")
    print(f"Player Skill: {results['player_skill']}")
    print("="*60)
    
    print("\n[RANK DISTRIBUTION]")
    config = GAME_MODES[results['mode']]
    for rank in range(1, config['players'] + 1):
        count = results['rank_distribution'].get(rank, 0)
        pct = (count / results['simulations']) * 100
        bar = "#" * int(pct / 2)
        print(f"  Rank {rank}: {bar} {pct:.1f}%")
    
    stats = results['statistics']
    print("\n[FINANCIAL ANALYSIS]")
    print(f"  Expected Value:     ${stats['expected_value']:+.4f}")
    print(f"  Std Deviation:      ${stats['std_deviation']:.4f}")
    print(f"  Min/Max Profit:     ${stats['min_profit']:.2f} / ${stats['max_profit']:.2f}")
    print(f"  Win Rate:           {stats['win_rate']:.1f}%")
    print(f"  Break-even Rate:    {stats['break_even_rate']:.1f}%")
    
    house = results['house_analysis']
    print("\n[HOUSE EDGE ANALYSIS]")
    print(f"  Entry Pool:         ${house['total_entry_per_game']:.2f}")
    print(f"  Prize Pool:         ${house['total_prize_per_game']:.2f}")
    print(f"  House Take:         ${house['house_take_per_game']:.2f}")
    print(f"  House Edge:         {house['house_edge_percent']:.1f}%")
    
    print("\n[SKILL IMPACT ANALYSIS]")
    for skill_key, data in results['skill_impact_analysis'].items():
        skill = skill_key.replace("skill_", "")
        print(f"  Skill {skill}: EV=${data['expected_value']:+.4f}, Win Rate={data['win_rate']:.1f}%")
    
    print("\n[GAME DURATION]")
    print(f"  Avg Duration:       {stats['avg_game_duration_seconds']:.1f} seconds")
    
    print("\n" + "="*60)
    
    # Fairness verdict
    ev = stats['expected_value']
    skill_diff = (
        results['skill_impact_analysis']['skill_0.8']['expected_value'] -
        results['skill_impact_analysis']['skill_0.2']['expected_value']
    )
    
    print("\n[GAME MECHANIC VERDICT]")
    
    if house['house_edge_percent'] < 15:
        print("  [OK] House edge is reasonable (<15%)")
    else:
        print("  [!] House edge is high (>15%)")
    
    if skill_diff > 0.1:
        print("  [OK] Skill significantly impacts outcomes")
    else:
        print("  [!] Skill has limited impact on outcomes")
    
    if stats['avg_game_duration_seconds'] >= 30:
        print("  [OK] Game duration meets 30+ second target")
    else:
        print("  [!] Games are shorter than 30 second target")
    
    if ev > -config['entry'] * 0.2:  # Within 20% of entry fee
        print("  [OK] Expected value is fair for skill-based game")
    else:
        print("  [!] Expected value may be too negative")
    
    print("\n")

if __name__ == "__main__":
    print("Starting QRON Monte Carlo Simulation...")
    print("This will simulate thousands of games to analyze fairness.\n")
    
    # Run comprehensive analysis
    all_results = analyze_all_modes(num_simulations=5000)
    
    # Print reports for each mode
    for mode, results in all_results.items():
        print_report(results)
    
    # Summary comparison
    print("\n" + "="*60)
    print("CROSS-MODE COMPARISON")
    print("="*60)
    print(f"{'Mode':<10} {'House Edge':<12} {'EV':<12} {'Win Rate':<12} {'Skill Impact'}")
    print("-"*60)
    
    for mode, results in all_results.items():
        house_edge = results['house_analysis']['house_edge_percent']
        ev = results['statistics']['expected_value']
        win_rate = results['statistics']['win_rate']
        skill_impact = (
            results['skill_impact_analysis']['skill_0.8']['expected_value'] -
            results['skill_impact_analysis']['skill_0.2']['expected_value']
        )
        print(f"{mode:<10} {house_edge:>8.1f}%    ${ev:>+6.3f}    {win_rate:>8.1f}%    ${skill_impact:>+.3f}")
    
    # Save results to JSON
    output_file = "monte_carlo_results.json"
    with open(output_file, 'w') as f:
        # Convert defaultdict to regular dict for JSON serialization
        serializable_results = {}
        for mode, data in all_results.items():
            data_copy = data.copy()
            data_copy['rank_distribution'] = dict(data_copy['rank_distribution'])
            data_copy['profits'] = data_copy['profits'][:100]  # Keep only first 100 for file size
            data_copy['game_durations'] = data_copy['game_durations'][:100]
            serializable_results[mode] = data_copy
        json.dump(serializable_results, f, indent=2)
    
    print(f"\nDetailed results saved to {output_file}")
    print("\n[DONE] Monte Carlo simulation complete!")
