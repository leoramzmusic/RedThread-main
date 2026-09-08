"""
Algorithm Service
Handles complex logic for algorithm management, including dynamic weight normalization.
"""

from typing import List, Dict, Any, Optional
from src.models.algorithm_management import AlgorithmFactor, AlgorithmType


class AlgorithmService:
    @staticmethod
    async def normalize_weights(
        algorithm_type: AlgorithmType, 
        factor_modified_id: str, 
        new_weight: float,
        locked_factor_ids: List[str] = []
    ) -> List[AlgorithmFactor]:
        """
        Normalizes weights of all factors for a given algorithm so they sum to 100%.
        
        Args:
            algorithm_type: The algorithm to normalize (CARE or COMPATIBILITY).
            factor_modified_id: The ID of the factor that was manually changed.
            new_weight: The new weight assigned to the modified factor.
            locked_factor_ids: List of factor IDs that should NOT be adjusted.
        """
        # Fetch all factors for the algorithm
        all_factors = await AlgorithmFactor.find(
            AlgorithmFactor.algorithm_type == algorithm_type
        ).to_list()
        
        if not all_factors:
            return []

        # Find the modified factor
        modified_factor = next((f for f in all_factors if str(f.id) == factor_modified_id), None)
        if not modified_factor:
            return all_factors

        # Calculate difference
        old_weight = modified_factor.weight
        difference = new_weight - old_weight
        
        # Identify adjustable factors (excluding modified and locked ones)
        adjustable_factors = [
            f for f in all_factors 
            if str(f.id) != factor_modified_id and str(f.id) not in locked_factor_ids
        ]
        
        if not adjustable_factors:
            # If no other factor can be adjusted, we can't normalize
            # In this case, we might just update the one and let the sum be != 100
            # OR force adjustment even if locked (not ideal)
            modified_factor.weight = new_weight
            await modified_factor.save()
            return all_factors

        # Total weight of adjustable factors
        total_adjustable_weight = sum(f.weight for f in adjustable_factors)
        
        if total_adjustable_weight == 0:
            # If all adjustable have 0 weight, distribute equitably
            adjustment_per_factor = -difference / len(adjustable_factors)
            for f in adjustable_factors:
                f.weight = max(0, f.weight + adjustment_per_factor)
        else:
            # Redistribute difference proportionally
            for f in adjustable_factors:
                proportion = f.weight / total_adjustable_weight
                adjustment = -proportion * difference
                f.weight = max(0, f.weight + adjustment)

        # Update modified factor
        modified_factor.weight = new_weight
        
        # Save all changes
        for f in all_factors:
            await f.save()
            
        return all_factors

    @staticmethod
    async def distribute_equitably(algorithm_type: AlgorithmType) -> List[AlgorithmFactor]:
        """
        Distributes weights equally among all factors of an algorithm.
        """
        all_factors = await AlgorithmFactor.find(
            AlgorithmFactor.algorithm_type == algorithm_type
        ).to_list()
        
        if not all_factors:
            return []
            
        equal_weight = 100.0 / len(all_factors)
        for f in all_factors:
            f.weight = equal_weight
            await f.save()
            
        return all_factors
