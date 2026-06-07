package com.onlinestore.thinktank.modules.customertier.repository;

import com.onlinestore.thinktank.modules.customertier.entity.CustomerTier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerTierRepository extends JpaRepository<CustomerTier, Long> {

    List<CustomerTier> findAllByOrderByMinSpendingAsc();
}