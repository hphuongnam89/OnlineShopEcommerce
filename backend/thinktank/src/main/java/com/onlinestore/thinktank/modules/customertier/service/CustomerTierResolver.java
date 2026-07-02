package com.onlinestore.thinktank.modules.customertier.service;

import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import com.onlinestore.thinktank.modules.customertier.repository.CustomerTierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerTierResolver {

    private static final BigDecimal VIP_MIN = new BigDecimal("5000000");
    private static final BigDecimal SILVER_MIN = new BigDecimal("10000000");
    private static final BigDecimal GOLD_MIN = new BigDecimal("20000000");
    private static final BigDecimal PLATINUM_MIN = new BigDecimal("50000000");

    private final CustomerTierRepository customerTierRepository;

    public CustomerTier resolveBySpent(BigDecimal totalSpent) {
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        if (tiers.isEmpty()) {
            return null;
        }

        if (totalSpent == null) {
            totalSpent = BigDecimal.ZERO;
        }

        if (totalSpent.compareTo(PLATINUM_MIN) >= 0) {
            return findTierByName(tiers, "PLATINUM", tiers.get(tiers.size() - 1));
        }
        if (totalSpent.compareTo(GOLD_MIN) >= 0) {
            return findTierByName(tiers, "GOLD", findBestTierByThreshold(tiers, GOLD_MIN));
        }
        if (totalSpent.compareTo(SILVER_MIN) >= 0) {
            return findTierByName(tiers, "SILVER", findBestTierByThreshold(tiers, SILVER_MIN));
        }
        if (totalSpent.compareTo(VIP_MIN) >= 0) {
            return findTierByName(tiers, "VIP", findBestTierByThreshold(tiers, VIP_MIN));
        }
        return findBronzeTier(tiers);
    }

    public CustomerTier resolveDefaultCustomerTier() {
        List<CustomerTier> tiers = customerTierRepository.findAllByOrderByMinSpendingAsc();
        if (tiers.isEmpty()) {
            return null;
        }
        CustomerTier silver = findTierByName(tiers, "SILVER", null);
        if (silver != null) {
            return silver;
        }
        return findBronzeTier(tiers);
    }

    public CustomerTier resolveBronzeTier() {
        return resolveDefaultCustomerTier();
    }

    private CustomerTier findBronzeTier(List<CustomerTier> tiers) {
        CustomerTier bronze = findTierByName(tiers, "BRONZE", null);
        if (bronze != null) {
            return bronze;
        }
        return tiers.stream()
                .min(Comparator.comparing(CustomerTier::getMinSpending))
                .orElse(tiers.get(0));
    }

    private CustomerTier findTierByName(List<CustomerTier> tiers, String name, CustomerTier fallback) {
        return tiers.stream()
                .filter(t -> name.equalsIgnoreCase(t.getName()))
                .findFirst()
                .orElse(fallback);
    }

    private CustomerTier findBestTierByThreshold(List<CustomerTier> tiers, BigDecimal threshold) {
        return tiers.stream()
                .filter(t -> t.getMinSpending() != null && t.getMinSpending().compareTo(threshold) <= 0)
                .max(Comparator.comparing(CustomerTier::getMinSpending))
                .orElseGet(() -> tiers.stream()
                        .min(Comparator.comparing(CustomerTier::getMinSpending))
                        .orElse(null));
    }
}
