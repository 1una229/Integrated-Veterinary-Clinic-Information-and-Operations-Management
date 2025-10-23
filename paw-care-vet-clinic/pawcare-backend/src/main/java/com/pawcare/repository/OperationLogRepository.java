package com.pawcare.repository;

import com.pawcare.entity.OperationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OperationLogRepository extends JpaRepository<OperationLog, Long> {
    
    @Query("SELECT o FROM OperationLog o WHERE DATE(o.ts) BETWEEN :startDate AND :endDate ORDER BY o.ts")
    List<OperationLog> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}

